import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../../firebase";
import {
  doc,
  collection,
  setDoc,
  getDoc,
  serverTimestamp,
} from "firebase/firestore";
import {
  Heart,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Home,
  Eye,
  ArrowRight,
  AlertCircle,
} from "lucide-react";

const questions = [
  "What is your pet's favorite game or toy?",
  "How does your pet like to spend a rainy day?",
  "Where does your pet love to go on outings?",
  "What outdoor activity does your pet enjoy the most?",
  "How does your pet react to meeting new animals?",
  "What tricks or commands does your pet love performing?",
  "What is your pet's preferred way to exercise?",
  "How does your pet feel about water-based activities?",
  "What treat or snack time activity does your pet look forward to?",
  "How does your pet like to relax or unwind after playtime?",
];

export default function SurveyPage() {
  const [responses, setResponses] = useState(
    questions.reduce((acc, q) => ({ ...acc, [q]: "" }), {})
  );
  const [loading, setLoading] = useState(true); // Start with loading true
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [expandedQuestions, setExpandedQuestions] = useState(new Set([0])); // First question expanded by default
  const [completedQuestions, setCompletedQuestions] = useState(new Set());

  const navigate = useNavigate();

  // Pre-fill any existing answers from Firebase
  useEffect(() => {
    const loadExistingResponses = async () => {
      if (!auth.currentUser) {
        setLoading(false);
        return;
      }

      try {
        const uid = auth.currentUser.uid;
        const snap = await getDoc(
          doc(db, "users", uid, "surveyResponses", "sentimentSurvey")
        );

        if (snap.exists()) {
          const data = snap.data();
          if (data.responses) {
            setResponses(data.responses);

            // Update completed questions based on loaded responses
            const completed = new Set();
            Object.entries(data.responses).forEach(([question, answer]) => {
              if (answer && answer.trim()) {
                completed.add(question);
              }
            });
            setCompletedQuestions(completed);
          }
        }
      } catch (err) {
        console.error("Failed to load existing survey:", err);
        setMessage("Failed to load your previous answers. Starting fresh.");
      } finally {
        setLoading(false);
      }
    };

    loadExistingResponses();
  }, []);

  const handleChange = (q, value) => {
    setResponses((prev) => ({ ...prev, [q]: value }));

    // Track completed questions
    if (value.trim()) {
      setCompletedQuestions((prev) => new Set([...prev, q]));
    } else {
      setCompletedQuestions((prev) => {
        const newSet = new Set([...prev]);
        newSet.delete(q);
        return newSet;
      });
    }
  };

  const toggleQuestion = (index) => {
    setExpandedQuestions((prev) => {
      const newSet = new Set([...prev]);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const handleSubmit = async () => {
    setSaving(true);
    setMessage("");

    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Please log in to submit your pet survey.");

      const uid = user.uid;

      // Overwrite the single sentimentSurvey doc
      await setDoc(
        doc(collection(db, "users", uid, "surveyResponses"), "sentimentSurvey"),
        { questions, responses, createdAt: serverTimestamp() },
        { merge: false }
      );

      // Also merge into the main user doc
      await setDoc(
        doc(db, "users", uid),
        { sentimentResponses: responses },
        { merge: true }
      );

      setMessage(
        "Survey submitted successfully! Finding your perfect matches..."
      );

      // Navigate home so matching picks up new data
      setTimeout(() => navigate("/home"), 2000);
    } catch (err) {
      console.error("Survey save failed:", err);
      setMessage(err.message || "Failed to submit survey. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleProceed = () => {
    if (
      window.confirm("Are you sure you don't want to answer and proceed ahead?")
    ) {
      navigate("/home");
    }
  };

  const completionPercentage = Math.round(
    (completedQuestions.size / questions.length) * 100
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-100 via-blue-50 to-pink-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mx-auto mb-4"></div>
          <p className="text-purple-600 font-medium">Loading your survey...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-blue-50 to-pink-100 px-4 py-8 md:py-4 mt-18 sm:mt-6 rounded-3xl backdrop-blur-sm shadow-xl border border-white/20">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mt-6 mb-6">
            <Heart className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
            Tell Us About Your Pet
          </h1>
          <p className="text-gray-600 mb-4">
            Help us find the perfect matches for your furry friend ✨
          </p>

          {/* Progress Bar */}
          <div className="max-w-md mx-auto">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-600">
                Progress
              </span>
              <span className="text-sm font-bold text-purple-600">
                {completionPercentage}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${completionPercentage}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {/* Questions */}
          {questions.map((question, idx) => {
            const isExpanded = expandedQuestions.has(idx);
            const isCompleted = completedQuestions.has(question);
            const response = responses[question];

            return (
              <div
                key={idx}
                className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 overflow-hidden max-w-full"
              >
                {/* Question Header */}
                <button
                  type="button"
                  onClick={() => toggleQuestion(idx)}
                  className="w-full p-6 flex items-center justify-between hover:bg-white/40 transition-colors duration-200"
                >
                  <div className="flex items-start sm:items-center sm:space-x-4 flex-wrap sm:flex-nowrap w-full">
                    <div
                      className={`w-10 h-10 mr-3 rounded-full flex items-center justify-center font-bold text-white transition-all duration-200 ${
                        isCompleted
                          ? "bg-gradient-to-r from-green-500 to-emerald-500"
                          : "bg-gradient-to-r from-purple-500 to-pink-500"
                      }`}
                    >
                      {isCompleted ? (
                        <Sparkles className="w-5 h-5" />
                      ) : (
                        <span className="text-sm">{idx + 1}</span>
                      )}
                    </div>
                    <div className="text-left flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-gray-800 leading-tight">
                        {question}
                      </h3>
                      {isCompleted && response && (
                        <p className="text-sm text-gray-600 mt-1 truncate max-w-md">
                          {response.length > 60
                            ? `${response.substring(0, 60)}...`
                            : response}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 shrink-0">
                    {isCompleted && (
                      <div className="px-2 py-1 bg-green-100 text-green-800 text-xs font-bold rounded-full whitespace-nowrap shrink-0">
                        Complete
                      </div>
                    )}
                    {isExpanded ? (
                      <ChevronUp className="w-6 h-6 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-6 h-6 text-gray-400" />
                    )}
                  </div>
                </button>

                {/* Answer Section */}
                <div
                  className={`transition-all duration-300 ease-in-out ${
                    isExpanded
                      ? "max-h-[400px] opacity-100"
                      : "max-h-0 opacity-0"
                  } overflow-hidden`}
                >
                  <div className="p-6 pt-0">
                    <div className="relative">
                      <textarea
                        value={response}
                        onChange={(e) => handleChange(question, e.target.value)}
                        className="w-full p-4 bg-white/60 border border-purple-200 rounded-2xl focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-200 placeholder-gray-400 resize-none text-sm sm:text-base"
                        placeholder="Share your pet's story here..."
                        rows="4"
                        required
                      />
                      <div className="absolute bottom-3 right-3 text-xs text-gray-400">
                        {response.length}/500
                      </div>
                    </div>

                    {/* Quick action buttons */}
                    <div className="flex justify-between items-center mt-3">
                      <div className="text-xs text-gray-500">
                        💡 Be specific - this helps us find better matches!
                      </div>
                      {response.trim() && (
                        <button
                          type="button"
                          onClick={() => {
                            if (idx < questions.length - 1) {
                              toggleQuestion(idx);
                              toggleQuestion(idx + 1);
                            }
                          }}
                          className="ml-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-bold rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all duration-200 flex items-center space-x-2"
                        >
                          <span>Next</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row justify-center gap-4 pt-6">
            <button
              type="button"
              onClick={() => navigate("/home")}
              className="px-8 py-4 bg-gradient-to-r from-gray-500 to-gray-600 text-white font-bold rounded-2xl hover:from-gray-600 hover:to-gray-700 transform hover:scale-105 transition-all duration-200 shadow-lg flex items-center justify-center space-x-2"
            >
              <Home className="w-5 h-5" />
              <span>Home</span>
            </button>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={saving || completedQuestions.size === 0}
              className="px-8 py-4 bg-gradient-to-r from-green-600 to-green-700 text-white font-bold rounded-2xl hover:from-green-700 hover:to-green-800 transform hover:scale-105 transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center space-x-2"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Saving & Finding Matches...</span>
                </>
              ) : (
                <>
                  <Eye className="w-5 h-5" />
                  <span>See Matches</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleProceed}
              className="px-8 py-4 bg-gradient-to-r from-red-500 to-red-600 text-white font-bold rounded-2xl hover:from-red-600 hover:to-red-700 transform hover:scale-105 transition-all duration-200 shadow-lg flex items-center justify-center space-x-2"
            >
              <AlertCircle className="w-5 h-5" />
              <span>Skip Survey</span>
            </button>
          </div>

          {/* Completion Stats */}
          {completedQuestions.size > 0 && (
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-6 border border-white/20 mt-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800">Survey Progress</h3>
                    <p className="text-sm text-gray-600">
                      {completedQuestions.size} of {questions.length} questions
                      answered
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    {completionPercentage}%
                  </div>
                  <div className="text-sm text-gray-600">Complete</div>
                </div>
              </div>
            </div>
          )}

          {/* Message */}
          {message && (
            <div className="text-center mt-6">
              <div
                className={`inline-block px-6 py-3 rounded-2xl font-medium ${
                  message.includes("success") || message.includes("Finding")
                    ? "bg-green-100 border border-green-300 text-green-800"
                    : message.includes("Failed")
                    ? "bg-red-100 border border-red-300 text-red-800"
                    : "bg-blue-100 border border-blue-300 text-blue-800"
                }`}
              >
                {message}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
