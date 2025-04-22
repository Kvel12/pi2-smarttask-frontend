import React from 'react';
import { FaCalendarAlt, FaExclamationCircle, FaTasks } from 'react-icons/fa';
import Chart from 'react-apexcharts';
import taskImage from '../assets/tarea.png';

const Dashboard = ({ projects }) => {
  // No mostrar dashboard si no hay proyectos
  if (!projects || projects.length === 0) {
    return (
      <div style={styles.noProjectsMessage}>
        <img src={taskImage} alt="No projects" style={styles.noProjectsImage} />
        <p>No projects available. Create a new project to see analytics!</p>
      </div>
    );
  }

  // Prepare data for the "Projects Created by Date" chart
  const projectsByDate = projects.reduce((acc, project) => {
    const dateStr = project.creation_date || project.createdAt;
    if (!dateStr) return acc;
    
    // Convertir a formato de fecha legible
    const date = new Date(dateStr);
    if (isNaN(date)) return acc;
    
    const formattedDate = date.toLocaleDateString();
    acc[formattedDate] = (acc[formattedDate] || 0) + 1;
    return acc;
  }, {});

  // Ordenar fechas cronológicamente
  const sortedDates = Object.keys(projectsByDate).sort((a, b) => new Date(a) - new Date(b));
  const projectsCount = sortedDates.map(date => projectsByDate[date]);

  const projectsByDateOptions = {
    chart: {
      type: 'bar',
      fontFamily: 'Roboto, sans-serif',
      toolbar: {
        show: false
      },
      background: '#f8f9fa',
      borderRadius: 10,
    },
    dataLabels: {
      enabled: true,
    },
    plotOptions: {
      bar: {
        borderRadius: 3,
      }
    },
    colors: ['#512da8'],
    xaxis: {
      categories: sortedDates,
      labels: {
        style: {
          fontSize: '12px'
        }
      }
    },
    title: {
      text: 'Projects Created by Date',
      align: 'center',
      style: {
        fontSize: '18px',
        fontWeight: 'bold',
        color: '#512da8'
      }
    },
    grid: {
      borderColor: '#ececec',
    },
    tooltip: {
      y: {
        formatter: (val) => `${val} project(s)`
      }
    }
  };

  const projectsByDateSeries = [
    {
      name: 'Projects',
      data: projectsCount,
    },
  ];

  // Prepare data for the "Projects by Priority" chart
  const projectsByPriority = projects.reduce((acc, project) => {
    const priority = project.priority || 'unknown';
    acc[priority] = (acc[priority] || 0) + 1;
    return acc;
  }, {});

  const priorities = Object.keys(projectsByPriority);
  const priorityCounts = Object.values(projectsByPriority);

  // Colores personalizados para prioridades
  const priorityColors = {
    'high': '#dc3545',
    'medium': '#ffc107',
    'low': '#28a745',
    'unknown': '#6c757d'
  };

  // Crear array de colores basado en prioridades
  const colors = priorities.map(priority => priorityColors[priority] || '#6c757d');

  const projectsByPriorityOptions = {
    chart: {
      type: 'pie',
      fontFamily: 'Roboto, sans-serif',
      background: '#f8f9fa',
      borderRadius: 10,
    },
    labels: priorities.map(p => p.charAt(0).toUpperCase() + p.slice(1)),
    colors: colors,
    title: {
      text: 'Projects by Priority',
      align: 'center',
      style: {
        fontSize: '18px',
        fontWeight: 'bold',
        color: '#512da8'
      }
    },
    legend: {
      position: 'bottom'
    },
    dataLabels: {
      formatter: (val, opts) => {
        return `${Math.round(val)}% (${priorityCounts[opts.seriesIndex]})`;
      }
    },
    responsive: [{
      breakpoint: 480,
      options: {
        chart: {
          width: 300
        },
        legend: {
          position: 'bottom'
        }
      }
    }]
  };

  // Generar stats para el resumen
  const totalProjects = projects.length;
  const highPriorityProjects = projectsByPriority['high'] || 0;
  
  // Calcular proyectos próximos a vencer (en los próximos 7 días)
  const now = new Date();
  const nextWeek = new Date();
  nextWeek.setDate(now.getDate() + 7);
  
  const upcomingDeadlines = projects.filter(project => {
    if (!project.culmination_date) return false;
    const deadline = new Date(project.culmination_date);
    return deadline >= now && deadline <= nextWeek;
  }).length;

  return (
    <div style={styles.dashboard}>
      {/* Stats Summary */}
      <div style={styles.statsContainer}>
        <div style={styles.statCard}>
          <div style={styles.statIcon}>
            <FaTasks size={24} />
          </div>
          <div style={styles.statInfo}>
            <h3 style={styles.statValue}>{totalProjects}</h3>
            <p style={styles.statLabel}>Total Projects</p>
          </div>
        </div>
        
        <div style={{...styles.statCard, background: 'linear-gradient(to right, #ff9966, #ff5e62)'}}>
          <div style={styles.statIcon}>
            <FaExclamationCircle size={24} />
          </div>
          <div style={styles.statInfo}>
            <h3 style={styles.statValue}>{highPriorityProjects}</h3>
            <p style={styles.statLabel}>High Priority Projects</p>
          </div>
        </div>
        
        <div style={{...styles.statCard, background: 'linear-gradient(to right, #56ab2f, #a8e063)'}}>
          <div style={styles.statIcon}>
            <FaCalendarAlt size={24} />
          </div>
          <div style={styles.statInfo}>
            <h3 style={styles.statValue}>{upcomingDeadlines}</h3>
            <p style={styles.statLabel}>Upcoming Deadlines</p>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div style={styles.chartContainer}>
        <div style={styles.chart}>
          <Chart
            options={projectsByDateOptions}
            series={projectsByDateSeries}
            type="bar"
            height={380}
          />
        </div>
        <div style={styles.chart}>
          <Chart
            options={projectsByPriorityOptions}
            series={priorityCounts}
            type="pie"
            height={380}
          />
        </div>
      </div>
    </div>
  );
};

const styles = {
  dashboard: {
    padding: '20px',
    backgroundColor: '#fff',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
  },
  statsContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '30px',
    flexWrap: 'wrap',
    gap: '20px',
  },
  statCard: {
    flex: '1 1 250px',
    display: 'flex',
    alignItems: 'center',
    padding: '20px',
    borderRadius: '10px',
    background: 'linear-gradient(to right, #4b6cb7, #182848)',
    color: '#fff',
    boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
  },
  statIcon: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: '50%',
    padding: '15px',
    marginRight: '15px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statInfo: {
    flex: 1,
  },
  statValue: {
    fontSize: '28px',
    margin: '0 0 5px 0',
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: '14px',
    margin: 0,
    opacity: 0.9,
  },
  chartContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    marginTop: '20px',
    gap: '20px',
  },
  chart: {
    flex: '1 1 45%',
    minWidth: '300px',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
    background: '#fff',
  },
  noProjectsMessage: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '50vh',
    textAlign: 'center',
    backgroundColor: '#fff',
    borderRadius: '8px',
    padding: '30px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
  },
  noProjectsImage: {
    width: '100px',
    height: '100px',
    marginBottom: '20px',
    opacity: '0.7',
  },
};

export default Dashboard;