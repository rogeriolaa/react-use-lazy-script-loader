import React, { useState, useEffect, useRef } from 'react'; // Added useState
import useLazyScriptLoader from '@n0n3br/react-use-lazy-script-loader';

function App() {
  const [loadScript, setLoadScript] = useState(false);
  const SCRIPT_URL = 'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.min.js';
  const { isLoading, isLoaded, error } = useLazyScriptLoader(loadScript ? SCRIPT_URL : null);
  const barChartRef = useRef(null);
  const doughnutChartRef = useRef(null);

  useEffect(() => {
    if (isLoaded && loadScript && window.Chart) {
      // Destroy existing charts before creating new ones
      if (barChartRef.current) {
        barChartRef.current.destroy();
      }
      if (doughnutChartRef.current) {
        doughnutChartRef.current.destroy();
      }

      // Bar Chart
      const barCanvasElement = document.getElementById('myBarChart');
      if (barCanvasElement) {
        const ctxBar = barCanvasElement.getContext('2d');
        barChartRef.current = new window.Chart(ctxBar, {
          type: 'bar',
          data: {
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            datasets: [{
              label: 'Weekly Steps',
              data: [8500, 12000, 10500, 15200, 9300, 11000, 7500],
              backgroundColor: 'rgba(132, 204, 22, 0.7)', // Lime-500
              borderColor: 'rgba(132, 204, 22, 1)',
              borderWidth: 1,
              borderRadius: 6,
              hoverBackgroundColor: 'rgba(132, 204, 22, 0.9)',
            }]
          },
          options: {
            responsive: true, maintainAspectRatio: false,
            scales: { 
              y: { beginAtZero: true, ticks: { color: 'rgb(156, 163, 175)', font: {size: 12} }, grid: {color: 'rgba(255,255,255,0.1)'} }, 
              x: { ticks: { color: 'rgb(156, 163, 175)', font: {size: 12} }, grid: {color: 'rgba(255,255,255,0.05)'} } 
            },
            plugins: { 
              legend: { display: true, position: 'top', labels: { color: 'rgb(209, 213, 219)', font: {size: 14}, padding: 15 } },
              tooltip: { backgroundColor: 'rgba(17, 24, 39, 0.85)', titleFont: {size: 14}, bodyFont: {size:12}, padding: 10, cornerRadius: 6 }
            }
          }
        });
      }

      // Doughnut Chart
      const doughnutCanvasElement = document.getElementById('myDoughnutChart');
      if (doughnutCanvasElement) {
        const ctxDoughnut = doughnutCanvasElement.getContext('2d');
        doughnutChartRef.current = new window.Chart(ctxDoughnut, {
          type: 'doughnut',
          data: {
            labels: ['Work', 'Commute', 'Exercise', 'Relaxing', 'Chores'],
            datasets: [{
              label: 'Time Allocation (hours)',
              data: [8, 2, 1.5, 4, 2.5],
              backgroundColor: [
                'rgba(239, 68, 68, 0.75)',  // Red-500
                'rgba(245, 158, 11, 0.75)', // Amber-500
                'rgba(16, 185, 129, 0.75)', // Emerald-500
                'rgba(59, 130, 246, 0.75)', // Blue-500
                'rgba(139, 92, 246, 0.75)'  // Violet-500
              ],
              borderColor: 'rgba(55, 65, 81, 0.8)', // gray-700 for borders
              borderWidth: 2,
              hoverOffset: 10,
              hoverBorderColor: 'rgba(31, 41, 55, 1)', // gray-800
            }]
          },
          options: {
            responsive: true, maintainAspectRatio: false,
            plugins: {
              legend: { position: 'bottom', labels: { color: 'rgb(209, 213, 219)', font: {size: 14}, padding: 15 } },
              tooltip: { bodySpacing: 6, padding: 12, cornerRadius: 6, backgroundColor: 'rgba(17, 24, 39, 0.85)' }
            },
            animation: { animateScale: true, animateRotate: true, duration: 900 }
          }
        });
      }
    }

    return () => {
      if (barChartRef.current) {
        barChartRef.current.destroy();
        barChartRef.current = null;
      }
      if (doughnutChartRef.current) {
        doughnutChartRef.current.destroy();
        doughnutChartRef.current = null;
      }
    };
  }, [isLoaded, loadScript]);

  return (
    <div className="min-h-screen w-screen bg-gradient-to-br from-gray-900 to-gray-800 text-gray-200 flex flex-col items-center p-4 sm:p-6 selection:bg-sky-500 selection:text-white">
      <header className="text-center my-8 sm:my-10"> {/* Increased top/bottom margin */}
        <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-cyan-400 to-teal-400 pb-2">
          Chart.js &amp; <code className="text-amber-400 bg-black/20 px-2 py-1 rounded-lg text-3xl sm:text-4xl shadow-sm">useLazyScriptLoader</code> Demo
        </h1>
        <p className="text-md sm:text-lg text-gray-400 mt-4">Showcasing asynchronous script loading in React with Tailwind CSS.</p>
      </header>

      {!loadScript && ( // Only show button if script isn't triggered yet
        <button
          onClick={() => setLoadScript(true)}
          className="mb-10 px-8 py-3 bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-600 hover:to-cyan-600 text-white font-bold text-lg rounded-lg shadow-xl transform hover:scale-105 transition-all duration-200 ease-in-out focus:outline-none focus:ring-4 focus:ring-sky-400 focus:ring-opacity-50"
        >
          Load Chart.js & Display Charts
        </button>
      )}
      
      {loadScript && ( // Container for button text change after initial click
         <div className="mb-10 h-[60px]"> {/* Reserve space for button text or loading messages */}
          <button
            className={`px-8 py-3 text-white font-bold text-lg rounded-lg shadow-xl transition-all duration-200 ease-in-out ${
              isLoading ? 'bg-yellow-600 cursor-wait' : 
              isLoaded ? 'bg-green-600' : 
              error ? 'bg-red-600' : 
              'bg-sky-600' // Fallback, though should be covered by loadScript
            }`}
            disabled={isLoading || isLoaded || error} // Disable during/after load attempt
          >
            {isLoading ? 'Loading Script...' : 
             isLoaded ? 'Charts Loaded Successfully!' : 
             error ? 'Loading Failed!' : 
             'Load Triggered!'}
          </button>
        </div>
      )}


      <main className="w-full max-w-5xl bg-gray-800/60 backdrop-blur-lg p-6 sm:p-8 rounded-2xl shadow-2xl border border-gray-700/50 min-h-[350px] flex flex-col items-center justify-center transition-all duration-300 ease-in-out">
        {!loadScript && (
          <div className="text-center p-4">
            <svg className="mx-auto h-20 w-20 text-gray-500 mb-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h12A2.25 2.25 0 0020.25 14.25V3M3.75 14.25V21a2.25 2.25 0 002.25 2.25h12a2.25 2.25 0 002.25-2.25V14.25m-18 0h18M12 16.5v6.75m-4.5-6.75v6.75m9-6.75v6.75M9 6.75h6M9 9.75h6m-6 3h6M3.75 6.75h.008v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
            </svg>
            <p className="text-2xl font-semibold text-gray-300 mb-2">Charts are ready to be loaded!</p>
            <p className="text-gray-400 text-md">Click the button above to fetch Chart.js and display the interactive charts.</p>
          </div>
        )}
        {loadScript && isLoading && (
          <div className="flex flex-col items-center text-yellow-400 p-4">
            <svg className="animate-spin h-12 w-12 text-yellow-500 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-xl font-semibold">Loading Chart.js script...</p>
          </div>
        )}
        {loadScript && error && (
          <div className="flex flex-col items-center text-red-400 p-4 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-red-500 mb-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <p className="text-xl font-semibold">Error loading script:</p>
            <p className="text-md text-red-300 mt-1">{error.message}</p>
          </div>
        )}
        {loadScript && isLoaded && (
          <div className="w-full text-center">
            {/* Success message can be removed or kept minimal as charts are the main feedback */}
            {/* <p className="text-lg font-medium text-green-400 mb-4">Chart.js loaded! Displaying charts:</p> */}
            <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 w-full mt-2"> {/* Changed to lg for side-by-side */}
              <div className="w-full lg:w-1/2 bg-gray-700/30 p-4 sm:p-6 rounded-xl shadow-xl border border-gray-600/50 hover:shadow-sky-500/20 transition-shadow duration-300">
                <h3 className="text-xl sm:text-2xl font-semibold text-sky-300 mb-4">Weekly Steps</h3>
                <div className="h-[300px] sm:h-[380px]"> {/* Adjusted height */}
                  <canvas id="myBarChart"></canvas>
                </div>
              </div>
              <div className="w-full lg:w-1/2 bg-gray-700/30 p-4 sm:p-6 rounded-xl shadow-xl border border-gray-600/50 hover:shadow-lime-500/20 transition-shadow duration-300">
                <h3 className="text-xl sm:text-2xl font-semibold text-lime-300 mb-4">Time Allocation</h3>
                <div className="h-[300px] sm:h-[380px]"> {/* Adjusted height */}
                  <canvas id="myDoughnutChart"></canvas>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="mt-10 pt-6 text-center text-gray-500 text-xs sm:text-sm border-t border-gray-700/50 w-full max-w-5xl">
        <p>Example app using Vite, React, Tailwind CSS, and <code className="text-sky-500 bg-gray-700/50 px-1.5 py-0.5 rounded">@n0n3br/react-use-lazy-script-loader</code></p>
      </footer>
    </div>
  );
}

export default App;
