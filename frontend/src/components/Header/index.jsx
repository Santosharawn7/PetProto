import React, { useState, useEffect, useRef } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { getCurrentUser } from "@/services/userService";
import FriendList from "../FriendList";
import LogoOmniverse from "../../assets/LogoOmniverse.png";
import { FaPaw, FaBell, FaSearch } from "react-icons/fa";
import { FiLogOut, FiMenu } from "react-icons/fi";
import { MdGroups } from "react-icons/md";
import { FiMessageCircle } from "react-icons/fi";

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return isMobile;
}

const API_URL =
  import.meta.env.VITE_API_URL ||
  process.env.VITE_API_URL ||
  "http://127.0.0.1:5000";

const Header = ({ onSearchClick, setIsLoggedIn }) => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const [requests, setRequests] = useState([]);
  const [desktopDropdown, setDesktopDropdown] = useState(""); // "messages" or "notifications"
  const [drawer, setDrawer] = useState(""); // "", "more", "messages", "notifications"

  const dropdownRef = useRef(null);
  const messagesRef = useRef(null);

  useEffect(() => {
    const fetchRequests = async () => {
      const token = localStorage.getItem("userToken");
      if (!token) return;
      try {
        const res = await axios.get(`${API_URL}/requests`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const incoming = res.data.incoming || [];
        setRequests(incoming.filter((r) => r.status === "pending"));
      } catch (err) {
        console.error("Failed to load requests", err);
      }
    };
    fetchRequests();
  }, []);

  useEffect(() => {
    const onClick = (e) => {
      if (!isMobile) {
        if (
          dropdownRef.current &&
          !dropdownRef.current.contains(e.target) &&
          messagesRef.current &&
          !messagesRef.current.contains(e.target)
        ) {
          setDesktopDropdown("");
        }
      }
    };
    window.addEventListener("click", onClick);
    return () => window.removeEventListener("click", onClick);
  }, [isMobile]);

  // Desktop Dropdown Handler
  const handleDesktopDropdown = (type) => (e) => {
    e.stopPropagation();
    setDesktopDropdown((d) => (d === type ? "" : type));
  };

  // Drawer controls
  const openDrawer = (type) => setDrawer(type);
  const closeDrawer = () => setDrawer("");

  // Logout - now also updates auth state for App.jsx
  const handleLogout = () => {
    localStorage.removeItem("userToken");
    if (setIsLoggedIn) setIsLoggedIn(false); // update app state
    closeDrawer();
    navigate("/login");
  };

  // Pet Profile handler for bottom menu (not in drawer)
  const handleProfileClick = async () => {
    const token = localStorage.getItem("userToken");
    if (!token) {
      closeDrawer();
      return navigate("/login");
    }
    try {
      const res = await getCurrentUser(token);
      closeDrawer();
      if (res.data.petProfile) navigate("/pet-profile");
      else navigate("/pet-profile", { state: { edit: true } });
    } catch {
      closeDrawer();
      navigate("/pet-profile", { state: { edit: true } });
    }
  };

  // -------- DESKTOP NAVIGATION --------
  const desktopNav = (
    <nav className="hidden md:flex space-x-8 items-center text-gray-700 font-extrabold mr-12">
      <NavLink
        to="/community"
        className={({ isActive }) =>
          `flex items-center gap-1 ${isActive ? "text-green-500 underline" : "hover:text-blue-700"}`
        }
      >
        <MdGroups className="text-2xl" />
        <span>Community</span>
      </NavLink>
      <button
        onClick={onSearchClick}
        className="flex items-center gap-2 hover:text-blue-700"
        title="Search Pets"
      >
        <FaSearch className="text-xl" />
        Search
      </button>
      <button
        onClick={handleProfileClick}
        className="flex items-center gap-2 hover:text-blue-700"
      >
        <FaPaw className="text-xl" />
        My Pet Profile
      </button>
      {/* Messages */}
      <div className="relative" ref={messagesRef}>
        <button
          onClick={handleDesktopDropdown("messages")}
          className="flex items-center gap-2 hover:text-blue-700"
          title="Messages"
        >
          <FiMessageCircle className="text-xl" />
          Message
        </button>
        {desktopDropdown === "messages" && (
          <div
            className="absolute right-0 mt-2 w-72 bg-white border rounded shadow-lg z-30"
            style={{ maxHeight: 350, overflowY: "auto" }}
          >
            <FriendList mini />
            <button
              className="w-full bg-blue-600 text-white py-3 hover:bg-blue-800 "
              onClick={() => {
                setDesktopDropdown("");
                navigate("/chat");
              }}
            >
              See All Messages
            </button>
          </div>
        )}
      </div>
      {/* Notifications */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={handleDesktopDropdown("notifications")}
          className="flex items-center gap-2 hover:text-blue-700"
          title="Requests"
        >
          <FaBell className="text-xl" />
          Notification
          {requests.length > 0 && (
            <span className="absolute -top-1 -right-3 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
              {requests.length}
            </span>
          )}
        </button>
        {desktopDropdown === "notifications" && (
          <div className="absolute right-0 mt-2 w-75 bg-white border rounded shadow-lg z-20">
            {requests.length === 0 ? (
              <p className="p-4 text-center text-gray-600">No new requests</p>
            ) : (
              requests.map(r => (
                <div key={r.id} className="flex justify-between items-center px-4 py-2 border-b last:border-none">
                  <div className="flex items-center space-x-3">
                    {r.fromAvatar && <img src={r.fromAvatar} alt={r.fromPetName || r.from} className="w-12 h-12 rounded-full object-cover" />}
                    <span className="font-bold text-lg truncate max-w-[100px]">{r.fromPetName || r.from}</span>
                  </div>
                  <div className="flex flex-col space-y-1">
                    <button onClick={() => handleRespond(r.id, 'accept')} className="bg-green-600 text-white text-sm px-6 py-2 rounded hover:bg-green-800">Accept</button>
                    <button onClick={() => handleRespond(r.id, 'reject')} className="bg-red-600 text-white text-sm px-6 py-2 rounded hover:bg-red-800">Reject</button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
      <button
        onClick={handleLogout}
        className="flex items-center gap-2 hover:text-red-600"
      >
        <FiLogOut className="text-xl" />
        Logout
      </button>
    </nav>
  );

  // ---- Mobile floating logo: Only the logo, big, top left, no bar ----
  const mobileLogoIcon = (
    <div
      className="md:hidden"
      style={{
        position: "absolute",
        top: 16,
        left: 18,
        zIndex: 30,
        background: "transparent",
        pointerEvents: "none",
      }}
    >
      <a
        href="/home"
        style={{ pointerEvents: "auto", display: "inline-block" }}
      >
        <img
          src={LogoOmniverse}
          alt="Omniverse of Pets Logo"
          className="h-20 w-auto"
          style={{ display: "block" }}
        />
      </a>
    </div>
  );

  // ---- Mobile: Top right search/message row ----
  const mobileTopRightIcons = (
    <div
      className="md:hidden flex items-center gap-4"
      style={{
        position: "absolute",
        top: 18,
        right: 18,
        zIndex: 31,
      }}
    >
      <button
        onClick={onSearchClick}
        className="bg-purple-500 rounded-full p-3 shadow-md flex items-center justify-center"
        style={{ width: 48, height: 48 }}
      >
        <FaSearch className="text-white text-2xl" />
      </button>
      <button
        onClick={() => openDrawer("messages")}
        className="bg-white rounded-full p-3 shadow-md flex items-center justify-center"
        style={{ width: 48, height: 48 }}
      >
        <FiMessageCircle className="text-purple-500 text-2xl" />
      </button>
    </div>
  );

  // -------- MOBILE NAVIGATION --------
  const mobileBottomNav = (
    <nav
      className="fixed bottom-0 left-0 right-0 bg-white shadow-lg flex items-center justify-between px-3 pb-2 pt-2 rounded-t-3xl z-50 md:hidden gap-x-2"
      style={{ minHeight: 76 }}
    >
      {/* Home Icon */}
      <NavLink
        to="/home"
        className={({ isActive }) =>
          `flex items-center justify-center ${isActive ? "text-green-500" : "text-gray-400"}`
        }
        style={{ flex: 1, minWidth: 48, minHeight: 48 }}
      >
        {/* Home icon only, no logo here */}
        <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 21v-6a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v6M22 11l-10-9-10 9"/>
        </svg>
      </NavLink>
      {/* Community */}
      <NavLink
        to="/community"
        className={({ isActive }) =>
          `flex items-center justify-center ${isActive ? "text-green-500" : "text-gray-400"}`
        }
        style={{ flex: 1, minWidth: 48, minHeight: 48 }}
      >
        <MdGroups className="w-12 h-12" />
      </NavLink>
      {/* Pet Profile */}
      <button
        onClick={handleProfileClick}
        className="flex items-center justify-center text-gray-400"
        style={{ flex: 1, minWidth: 44, minHeight: 44 }}
      >
        <FaPaw className="w-10 h-10" />
      </button>
      {/* More */}
      <button
        onClick={() => openDrawer("more")}
        className="flex items-center justify-center text-gray-400"
        style={{ flex: 1, minWidth: 44, minHeight: 44 }}
      >
        <FiMenu className="w-10 h-10" />
      </button>
    </nav>
  );

  // ------ MOBILE: Drawer Overlay ------
  const drawerOverlay = isMobile && drawer && (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-40" onClick={closeDrawer}>
      <div
        className={`
          fixed bottom-0 left-0 right-0 z-50
          flex justify-center
        `}
        style={{ pointerEvents: "none" }}
      >
        <div
          className={`
            bg-white w-full max-w-md mx-auto rounded-t-3xl shadow-2xl
            transform transition-transform duration-300
            ${drawer ? "translate-y-0" : "translate-y-full"}
          `}
          style={{
            minHeight: 220,
            pointerEvents: "auto",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex flex-col gap-2 pt-6 pb-6 px-6">
            <div className="flex justify-center pb-3">
              <div className="w-10 h-1.5 rounded-full bg-gray-300" />
            </div>
            {drawer === "more" && (
              <>
                <button
                  className="flex items-center gap-3 p-4 border-b w-full"
                  onClick={() => openDrawer("messages")}
                >
                  <FiMessageCircle className="text-xl" /> Messages
                </button>
                <button
                  className="flex items-center gap-3 p-4 border-b w-full"
                  onClick={() => openDrawer("notifications")}
                >
                  <FaBell className="text-xl" /> Notifications
                  {requests.length > 0 && (
                    <span className="ml-2 text-red-600">
                      ({requests.length})
                    </span>
                  )}
                </button>
                <button
                  className="flex items-center gap-3 p-4 w-full text-red-600"
                  onClick={handleLogout}
                >
                  <FiLogOut className="text-xl" /> Logout
                </button>
              </>
            )}
            {drawer === "messages" && (
              <>
                <h2 className="font-bold text-lg p-4 border-b">Messages</h2>
                <div className="p-2">
                  <FriendList mini />
                  <button
                    className="w-full bg-blue-600 text-white py-3 hover:bg-blue-800 mt-2"
                    onClick={() => {
                      closeDrawer();
                      navigate("/chat");
                    }}
                  >
                    See All Messages
                  </button>
                </div>
              </>
            )}
            {drawer === "notifications" && (
              <>
                <h2 className="font-bold text-lg p-4 border-b">Notifications</h2>
                <div className="p-2">
                  {requests.length === 0 ? (
                    <p className="text-center text-gray-600">No new requests</p>
                  ) : (
                    requests.map((r) => (
                      <div
                        key={r.id}
                        className="flex justify-between items-center px-4 py-2 border-b last:border-none"
                      >
                        <div className="flex items-center space-x-3">
                          {r.fromAvatar && (
                            <img
                              src={r.fromAvatar}
                              alt={r.fromPetName || r.from}
                              className="w-12 h-12 rounded-full object-cover"
                            />
                          )}
                          <span className="font-bold text-lg truncate max-w-[100px]">
                            {r.fromPetName || r.from}
                          </span>
                        </div>
                        <div className="flex flex-col space-y-1">
                          <button
                            onClick={() => handleRespond(r.id, "accept")}
                            className="bg-green-600 text-white text-sm px-6 py-2 rounded hover:bg-green-800"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => handleRespond(r.id, "reject")}
                            className="bg-red-600 text-white text-sm px-6 py-2 rounded hover:bg-red-800"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}
          </div>
          <button
            className="absolute top-2 right-5 text-2xl text-gray-400"
            onClick={closeDrawer}
            style={{ zIndex: 10 }}
          >
            ✕
          </button>
        </div>
        <style>{`
          .slide-up-drawer {
            animation: slideupdrawer 0.25s cubic-bezier(.4,0,.2,1);
          }
          @keyframes slideupdrawer {
            from { transform: translateY(100%); }
            to { transform: translateY(0); }
          }
        `}</style>
      </div>
    </div>
  );

  // --------- Main Render ---------
  return (
    <>
      {/* Desktop: Logo at top-left */}
      <header className="w-full pb-8 flex justify-between items-center md:pb-8 relative">
        {!isMobile && (
          <div className="flex items-center">
            <a href="/home">
              <img
                src={LogoOmniverse}
                alt="Omniverse of Pets Logo"
                className="h-36 w-auto ml-8"
              />
            </a>
          </div>
        )}
        {desktopNav}
      </header>

      {/* Mobile: Only the logo icon, big, top left, no bar */}
      {isMobile && mobileLogoIcon}
      {/* Mobile: Top right, search & message icons */}
      {isMobile && mobileTopRightIcons}

      {mobileBottomNav}
      {drawerOverlay}
    </>
  );
};

export default Header;
