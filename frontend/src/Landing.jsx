import React from 'react'

const Landing = () => {
  return (
    <div>
        <div class="bg-gradient-to-b from-blue-900 via-blue-800 to-blue-500 px-6 sm:py-20 py-10">
      <div class="max-w-screen-xl mx-auto text-center text-white">
        <h1 class="text-5xl max-sm:text-3xl font-bold leading-tight mb-6">Welcome to Pet Dating Site</h1>
        <p class="text-lg mb-12">Experience the pet matching and friendship through our application.</p>
        <button type="button" class="bg-blue-600 text-white text-lg font-medium tracking-wide px-8 py-2.5 rounded-full transition duration-300 ease-in-out shadow-lg hover:shadow-xl"><a href='/login'>Get Started</a></button>
      </div>
    </div>
    </div>
  )
}

export default Landing