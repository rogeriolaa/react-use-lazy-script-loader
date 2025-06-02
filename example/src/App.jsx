import React, { useEffect, useRef } from 'react';
import useLazyScriptLoader from '@n0n3br/react-use-lazy-script-loader';

function App() {
  const SCRIPT_URL = 'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.min.js';
  const { isLoading, isLoaded, error } = useLazyScriptLoader(SCRIPT_URL);
  const chartInstanceRef = useRef(null);

  useEffect(() => {
    if (isLoaded && window.Chart) {
      const canvasElement = document.getElementById('myChart');
      if (!canvasElement) return;
      const ctx = canvasElement.getContext('2d');

      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
      }

      chartInstanceRef.current = new window.Chart(ctx, {
        type: 'bar',
        data: {
          labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
          datasets: [{
            label: 'Demo Data',
            data: [12, 19, 3, 5, 2, 3],
            backgroundColor: 'rgba(59, 130, 246, 0.7)', // Tailwind blue-500, increased opacity
            borderColor: 'rgba(59, 130, 246, 1)',
            borderWidth: 1,
            borderRadius: 8, // Slightly more rounded bars
            barThickness: 35, // Adjusted bar thickness
            hoverBackgroundColor: 'rgba(59, 130, 246, 0.9)',
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true,
              ticks: { color: 'rgb(156, 163, 175)', font: { size: 12, weight: '500' } }, // Tailwind gray-400, adjusted font
              grid: { color: 'rgba(255, 255, 255, 0.08)' } // Slightly more visible grid lines
            },
            x: {
              ticks: { color: 'rgb(156, 163, 175)', font: { size: 12, weight: '500' } }, // Tailwind gray-400, adjusted font
              grid: { color: 'rgba(255, 255, 255, 0.03)' } // Less prominent x-axis grid lines
            }
          },
          plugins: {
            legend: {
              display: true,
              position: 'top', // Standard legend position
              labels: { 
                color: 'rgb(209, 213, 219)', // Tailwind gray-300
                font: { size: 14, weight: '500' },
                padding: 20, // Add padding to legend items
              }
            },
            tooltip: {
              enabled: true,
              backgroundColor: 'rgba(17, 24, 39, 0.85)', // Darker tooltip (gray-900 based)
              titleColor: 'rgb(229, 231, 235)', // Tailwind gray-200
              bodyColor: 'rgb(209, 213, 219)', // Tailwind gray-300
              titleFont: { size: 14, weight: 'bold' },
              bodyFont: { size: 12 },
              padding: 12,
              cornerRadius: 6,
              borderColor: 'rgba(255, 255, 255, 0.1)',
              borderWidth: 1,
            }
          },
          animation: {
            duration: 800, // Slightly faster animation
            easing: 'easeOutCubic'
          }
        }
      });
    }

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
        chartInstanceRef.current = null;
      }
    };
  }, [isLoaded]);

  return (
    <div className="min-h-screen w-screen bg-gradient-to-br from-gray-900 to-gray-800 text-gray-100 flex flex-col items-center justify-center p-4 sm:p-8 selection:bg-sky-500 selection:text-white">
      <header className="text-center mb-10 pb-4 border-b border-gray-700/50">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-cyan-300 pb-2">
          Chart.js &amp; <code className="text-amber-400 bg-gray-700/50 px-2 py-0.5 rounded-md text-3xl sm:text-4xl">useLazyScriptLoader</code> Demo
        </h1>
        <p className="text-md sm:text-lg text-gray-400 mt-3">Showcasing asynchronous script loading in React with Tailwind CSS.</p>
      </header>
      
      <div className="w-full max-w-3xl bg-gray-800/70 backdrop-blur-md p-6 sm:p-8 rounded-xl shadow-2xl border border-gray-700/60 min-h-[250px] flex flex-col items-center justify-center transition-all duration-300 ease-in-out">
        {isLoading && (
          <div className="flex flex-col items-center text-yellow-400">
            <svg className="animate-spin h-10 w-10 text-yellow-500 mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-lg font-medium">Loading Chart.js script...</p>
          </div>
        )}
        {error && (
          <div className="flex flex-col items-center text-red-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-red-600 mb-3" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <p className="text-lg font-medium">Error loading script:</p>
            <p className="text-sm text-red-400 mt-1">{error.message}</p>
          </div>
        )}
        {isLoaded && (
          <div className="w-full text-center">
            <p className="text-lg font-medium text-green-400 mb-1">Chart.js script loaded successfully!</p>
            <div className="mt-4 h-[400px] sm:h-[450px] w-full p-1 bg-gray-700/50 rounded-lg shadow-inner border border-gray-600/50">
              <canvas id="myChart" className=""></canvas> {/* Removed direct bg, p from canvas, parent div handles it */}
            </div>
          </div>
        )}
      </div>

      <footer className="mt-10 pt-4 text-center text-gray-500 text-xs sm:text-sm border-t border-gray-700/50 w-full max-w-3xl">
        <p>Example app using Vite, React, Tailwind CSS, and <code className="text-sky-500 bg-gray-700/50 px-1.5 py-0.5 rounded">@n0n3br/react-use-lazy-script-loader</code></p>
      </footer>
    </div>
  );
}

export default App;
