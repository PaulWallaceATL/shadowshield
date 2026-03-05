'use client';

import { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface PerformanceChartProps {
  data: {
    label: string;
    queries: number;
    latency: number;
  }[];
}

const PerformanceChart = ({ data }: PerformanceChartProps) => {
  const [chartData, setChartData] = useState<any>(null);

  useEffect(() => {
    if (data && data.length > 0) {
      setChartData({
        labels: data.map(item => item.label),
        datasets: [
          {
            label: 'Queries',
            data: data.map(item => item.queries),
            borderColor: '#00a0cb',
            backgroundColor: 'rgba(0, 160, 203, 0.1)',
            fill: true,
            tension: 0.4,
            yAxisID: 'y',
          },
          {
            label: 'Average Latency (ms)',
            data: data.map(item => item.latency),
            borderColor: '#2f4faa',
            backgroundColor: 'rgba(47, 79, 170, 0.1)',
            fill: true,
            tension: 0.4,
            yAxisID: 'y1',
          }
        ]
      });
    }
  }, [data]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: '#f1f5f9',
          font: {
            size: 12
          }
        }
      },
      title: {
        display: false,
        text: '24-Hour Performance Metrics',
        color: '#f1f5f9',
        font: {
          size: 16,
          weight: 'bold' as const
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: '#555',
        borderWidth: 1,
        padding: 10,
        displayColors: true,
        callbacks: {
          label: function(context: any) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.datasetIndex === 0) {
              label += context.parsed.y;
            } else {
              label += context.parsed.y + ' ms';
            }
            return label;
          }
        }
      }
    },
    scales: {
      x: {
        ticks: {
          color: '#d1d5db',
          maxRotation: 45,
          minRotation: 45
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        }
      },
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        beginAtZero: true,
        ticks: {
          color: '#d1d5db',
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
        title: {
          display: true,
          text: 'Queries',
          color: '#d1d5db'
        }
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        beginAtZero: true,
        grid: {
          drawOnChartArea: false,
          color: 'rgba(255, 255, 255, 0.1)',
        },
        ticks: {
          color: '#d1d5db',
        },
        title: {
          display: true,
          text: 'Latency (ms)',
          color: '#d1d5db'
        }
      },
    },
  };

  return (
    <div className="h-[400px] relative">
      {chartData ? (
        <Line data={chartData} options={chartOptions} />
      ) : (
        <div className="flex justify-center items-center h-full">
          <p className="text-gray-400">Processing chart data...</p>
        </div>
      )}
    </div>
  );
};

export default PerformanceChart; 