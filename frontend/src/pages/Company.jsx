import { Link } from 'react-router-dom'

export default function Company() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link to="/company" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold">GT</div>
          <span className="text-lg font-semibold text-slate-800">GlobeTrotter</span>
        </Link>
        <nav className="flex items-center gap-3">
          <Link to="/login" className="text-slate-700 hover:text-primary">Sign in</Link>
          <Link to="/signup" className="bg-primary text-white px-4 py-2 rounded-md hover:opacity-90">Get started</Link>
        </nav>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10">
        <section className="text-center">
          <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 tracking-tight">
            Plan smarter trips with <span className="text-primary">GlobeTrotter</span>
          </h1>
          <p className="mt-4 text-lg md:text-xl text-slate-600 max-w-3xl mx-auto">
            Seamlessly organize itineraries, stops, and activities. Share your journeys, find inspiration, and make every trip unforgettable.
          </p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <Link to="/signup" className="bg-primary text-white px-6 py-3 rounded-md font-medium hover:opacity-90">Create your account</Link>
            <Link to="/login" className="px-6 py-3 rounded-md font-medium border border-slate-300 text-slate-700 hover:bg-white">Sign in</Link>
          </div>
        </section>

        <section className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow p-6">
            <div className="w-10 h-10 rounded-md bg-primary/10 text-primary flex items-center justify-center font-bold">1</div>
            <h3 className="mt-4 text-lg font-semibold">Create Trips</h3>
            <p className="text-slate-600 mt-1">Set trip dates and details in seconds with a clean, intuitive interface.</p>
          </div>
          <div className="bg-white rounded-xl shadow p-6">
            <div className="w-10 h-10 rounded-md bg-primary/10 text-primary flex items-center justify-center font-bold">2</div>
            <h3 className="mt-4 text-lg font-semibold">Add Stops</h3>
            <p className="text-slate-600 mt-1">Pin cities and stops with dates and custom ordering to shape your journey.</p>
          </div>
          <div className="bg-white rounded-xl shadow p-6">
            <div className="w-10 h-10 rounded-md bg-primary/10 text-primary flex items-center justify-center font-bold">3</div>
            <h3 className="mt-4 text-lg font-semibold">Plan Activities</h3>
            <p className="text-slate-600 mt-1">Track activities, costs, and durations to maximize your time on the road.</p>
          </div>
        </section>

        <section className="mt-16 text-center">
          <h2 className="text-2xl font-semibold">Built for speed at hackathon scale</h2>
          <p className="text-slate-600 mt-2 max-w-2xl mx-auto">
            GlobeTrotter is a modern, mobile-first MVP using React, Tailwind, and a secure Node backend. Ready to demo, ship, and grow.
          </p>
          <a href="mailto:team@globetrotter.app" className="inline-block mt-4 text-primary hover:underline">Contact us</a>
        </section>
      </main>

      <footer className="mt-16 border-t py-6">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between text-sm text-slate-600">
          <span>© {new Date().getFullYear()} GlobeTrotter</span>
          <div className="flex gap-4">
            <Link to="/company" className="hover:underline">Company</Link>
            <a className="hover:underline" href="mailto:team@globetrotter.app">Support</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
