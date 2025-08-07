import React, { useState, useEffect } from 'react';
import { ChevronDown, Heart, Users, Shield, Star, Mail, Phone, MapPin } from 'lucide-react';

export default function OmniverseLandingPage() {
  const [scrollY, setScrollY] = useState(0);
  const [isVisible, setIsVisible] = useState({});

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setIsVisible(prev => ({
            ...prev,
            [entry.target.id]: entry.isIntersecting
          }));
        });
      },
      { threshold: 0.1 }
    );

    const elements = document.querySelectorAll('[data-animate]');
    elements.forEach(el => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  // REMOVED THE PROBLEMATIC BACKGROUND OVERRIDE
  // This was causing the gradient to disappear on other pages

  const pets = [
    { emoji: '🐕', name: 'Dogs', description: 'Loyal companions' },
    { emoji: '🐱', name: 'Cats', description: 'Independent spirits' },
    { emoji: '🐦', name: 'Birds', description: 'Colorful friends' },
    { emoji: '🐰', name: 'Rabbits', description: 'Gentle hoppers' },
    { emoji: '🐢', name: 'Reptiles', description: 'Ancient wisdom' },
    { emoji: '🐠', name: 'Fish', description: 'Aquatic beauty' },
  ];

  return (
    // CHANGED: Removed fixed positioning and z-index that was covering everything
    // Added white background only to this component, not the entire body
    <div className="min-h-screen bg-white overflow-x-hidden">
      
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-white/90 backdrop-blur-md shadow-lg transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full overflow-hidden">
                <img 
                  src="/src/assets/LogoOmniverse.png" 
                  alt="Omniverse of Pets Logo"
                  className="w-full h-full object-cover"
                />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Omniverse of Pets
              </h1>
            </div>
            <div className="hidden md:flex space-x-8">
              <a href="#home" className="text-gray-700 hover:text-purple-600 transition-colors">Home</a>
              <a href="#explore" className="text-gray-700 hover:text-purple-600 transition-colors">Explore</a>
              <a href="#about" className="text-gray-700 hover:text-purple-600 transition-colors">About</a>
              <a href="#contact" className="text-gray-700 hover:text-purple-600 transition-colors">Contact</a>
            </div>
            <a 
              href="/login" 
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-2 rounded-full hover:shadow-lg transform hover:scale-105 transition-all duration-300"
            >
              Sign In
            </a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section 
        id="home" 
        className="relative min-h-screen flex items-center justify-center overflow-hidden"
        style={{
          backgroundImage: `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url('https://thumbs.dreamstime.com/z/group-pets-gathered-together-white-banner-isolated-against-white-background-group-pets-gathered-together-358356283.jpg?ct=jpeg')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
          backgroundRepeat: 'no-repeat'
        }}
      >
        
        {/* Hero Content */}
        <div className="relative z-10 text-center text-white max-w-4xl mx-auto px-4">
          <div 
            className="transform transition-all duration-1000 ease-out"
            style={{
              opacity: scrollY < 100 ? 1 : 0,
              transform: `translateY(${scrollY * 0.3}px)`
            }}
          >
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              Explore the World of 
              <span className="block bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                Pets
              </span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-gray-200 max-w-2xl mx-auto">
              Where every pet finds their perfect match, every owner discovers their companion, 
              and every story becomes legendary.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-full text-lg font-semibold hover:shadow-2xl transform hover:scale-105 transition-all duration-300">
                Start Your Journey
              </button>
              <button className="border-2 border-white text-white px-8 py-4 rounded-full text-lg font-semibold hover:bg-white hover:text-purple-600 transition-all duration-300">
                Learn More
              </button>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <ChevronDown className="w-8 h-8 text-white" />
        </div>

        {/* Floating Pet Icons */}
        <div className="absolute top-1/4 left-10 animate-pulse">
          <div className="text-6xl opacity-30">🐕</div>
        </div>
        <div className="absolute top-1/3 right-10 animate-pulse delay-1000">
          <div className="text-6xl opacity-30">🐱</div>
        </div>
        <div className="absolute bottom-1/4 left-20 animate-pulse delay-2000">
          <div className="text-6xl opacity-30">🐦</div>
        </div>
      </section>

      {/* Explore Section */}
      <section id="explore" className="py-20 bg-gradient-to-br from-purple-100 via-pink-100 to-indigo-100 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Section Header */}
          <div 
            id="explore-header" 
            data-animate
            className={`text-center mb-16 transform transition-all duration-1000 ${
              isVisible['explore-header'] ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'
            }`}
          >
            <h2 className="text-5xl md:text-6xl font-bold mb-6">
              <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 bg-clip-text text-transparent">
                Let's Explore
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Dive into the magnificent universe where every pet species thrives, 
              connects, and creates beautiful memories together.
            </p>
          </div>

          {/* Pet Categories Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-8 mb-16">
            {pets.map((pet, index) => (
              <div
                key={pet.name}
                id={`pet-${index}`}
                data-animate
                className={`group transform transition-all duration-1000 delay-${index * 100} ${
                  isVisible[`pet-${index}`] ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-20 opacity-0 scale-95'
                }`}
              >
                <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 text-center hover:shadow-2xl hover:scale-105 transition-all duration-300 group-hover:bg-white">
                  <div className="text-6xl mb-4 group-hover:scale-110 transition-transform duration-300">
                    {pet.emoji}
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">{pet.name}</h3>
                  <p className="text-gray-600">{pet.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Features Section */}
          <div 
            id="features" 
            data-animate
            className={`grid md:grid-cols-3 gap-8 transform transition-all duration-1000 ${
              isVisible['features'] ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'
            }`}
          >
            <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 text-center hover:shadow-xl transition-all duration-300">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Connect & Share</h3>
              <p className="text-gray-600">Build lasting friendships in our vibrant pet community</p>
            </div>
            
            <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 text-center hover:shadow-xl transition-all duration-300">
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Safe & Secure</h3>
              <p className="text-gray-600">Your pet's safety and privacy are our top priorities</p>
            </div>
            
            <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 text-center hover:shadow-xl transition-all duration-300">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Find Love</h3>
              <p className="text-gray-600">Help your pet find your perfect companion or playmate</p>
            </div>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-10 left-10 text-8xl opacity-10 animate-spin-slow">🌟</div>
        <div className="absolute bottom-10 right-10 text-8xl opacity-10 animate-bounce">💖</div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            
            {/* Text Content */}
            <div 
              id="about-text" 
              data-animate
              className={`transform transition-all duration-1000 ${
                isVisible['about-text'] ? 'translate-x-0 opacity-100' : '-translate-x-20 opacity-0'
              }`}
            >
              <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                About Omniverse of Pets
              </h2>
              <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                Welcome to the ultimate convergence of all pet domains! Our platform brings together 
                every corner of the pet universe into one magnificent, interconnected ecosystem.
              </p>
              <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                From the loyal companionship of dogs to the independent grace of cats, from the 
                vibrant songs of birds to the gentle nature of rabbits, from the ancient wisdom 
                of reptiles to the serene beauty of aquatic life - we celebrate them all.
              </p>
              <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                Here, pet owners, enthusiasts, veterinarians, and pet service providers unite 
                to create a thriving community where every pet story matters, every bond is 
                cherished, and every connection enriches lives.
              </p>
              
              {/* Stats */}
              <div className="grid grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600">10K+</div>
                  <div className="text-gray-600">Happy Pets</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600">5K+</div>
                  <div className="text-gray-600">Pet Parents</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600">500+</div>
                  <div className="text-gray-600">Success Stories</div>
                </div>
              </div>
            </div>

            {/* Image Content */}
            <div 
              id="about-image" 
              data-animate
              className={`transform transition-all duration-1000 ${
                isVisible['about-image'] ? 'translate-x-0 opacity-100' : 'translate-x-20 opacity-0'
              }`}
            >
              <div className="relative">
                <img 
                  src="https://images.unsplash.com/photo-1601758228041-f3b2795255f1?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80"
                  alt="Happy pets together"
                  className="rounded-3xl shadow-2xl"
                />
                <div className="absolute -top-6 -right-6 w-24 h-24 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center animate-pulse">
                  <Star className="w-12 h-12 text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Section Header */}
          <div 
            id="contact-header" 
            data-animate
            className={`text-center mb-16 transform transition-all duration-1000 ${
              isVisible['contact-header'] ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'
            }`}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Contact Us
            </h2>
            <p className="text-xl text-gray-300">Drop us a line! We'd love to hear from you.</p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12">
            
            {/* Contact Form */}
            <div 
              id="contact-form" 
              data-animate
              className={`transform transition-all duration-1000 ${
                isVisible['contact-form'] ? 'translate-x-0 opacity-100' : '-translate-x-20 opacity-0'
              }`}
            >
              <div className="space-y-6">
                <div>
                  <input
                    type="text"
                    placeholder="Name"
                    className="w-full p-4 bg-gray-800 border border-gray-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-gray-400"
                  />
                </div>
                <div>
                  <input
                    type="email"
                    placeholder="Email"
                    className="w-full p-4 bg-gray-800 border border-gray-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-gray-400"
                  />
                </div>
                <div>
                  <textarea
                    rows="6"
                    placeholder="Message"
                    className="w-full p-4 bg-gray-800 border border-gray-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-gray-400 resize-none"
                  />
                </div>
                <button
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-xl font-semibold hover:shadow-lg transform hover:scale-105 transition-all duration-300"
                  onClick={() => alert('Thank you for your message! We\'ll get back to you soon.')}
                >
                  Send Message
                </button>
              </div>
            </div>

            {/* Contact Info */}
            <div 
              id="contact-info" 
              data-animate
              className={`transform transition-all duration-1000 ${
                isVisible['contact-info'] ? 'translate-x-0 opacity-100' : 'translate-x-20 opacity-0'
              }`}
            >
              <div className="space-y-8">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                    <Mail className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Email</h3>
                    <p className="text-gray-400">hello@omniverseofpets.com</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                    <Phone className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Phone</h3>
                    <p className="text-gray-400">+1 (555) 123-PETS</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                    <MapPin className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Location</h3>
                    <p className="text-gray-400">Worldwide Pet Community</p>
                  </div>
                </div>
              </div>

              {/* Social Links */}
              <div className="mt-12">
                <h3 className="text-lg font-semibold mb-4">Follow Us</h3>
                <div className="flex space-x-4">
                  <div className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-purple-600 transition-colors cursor-pointer">
                    <span className="text-sm">📘</span>
                  </div>
                  <div className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-purple-600 transition-colors cursor-pointer">
                    <span className="text-sm">📷</span>
                  </div>
                  <div className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-purple-600 transition-colors cursor-pointer">
                    <span className="text-sm">🐦</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <div className="w-8 h-8 rounded-full overflow-hidden">
                <img 
                  src="/src/assets/LogoOmniverse.png" 
                  alt="Omniverse of Pets Logo"
                  className="w-full h-full object-cover"
                />
              </div>
              <h3 className="text-xl font-bold">Omniverse of Pets</h3>
            </div>
            <p className="text-gray-400 mb-4">
              Connecting pet hearts across the universe, one paw at a time.
            </p>
            <p className="text-gray-500 text-sm">
              © 2024 Omniverse of Pets. All rights reserved. Made with 💜 for pet lovers everywhere.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}