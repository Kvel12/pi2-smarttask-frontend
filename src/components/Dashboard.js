import React from 'react';
import Chart from 'react-apexcharts';
import { deleteProject, createProject, updateProject, fetchTasksByProjectId } from '../api';

const Dashboard = ({ projects }) => {
  // Prepare data for the "Projects Created by Date" chart
  const projectsByDate = projects.reduce((acc, project) => {
    const date = new Date(project.creation_date || project.createdAt).toLocaleDateString();
    acc[date] = (acc[date] || 0) + 1;
    return acc;
  }, {});

  const dates = Object.keys(projectsByDate);
  const projectsCount = Object.values(projectsByDate);

  const projectsByDateOptions = {
    chart: {
      type: 'bar',
    },
    xaxis: {
      categories: dates,
    },
    title: {
      text: 'Projects Created by Date',
    },
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

  const projectsByPriorityOptions = {
    chart: {
      type: 'pie',
    },
    labels: priorities,
    title: {
      text: 'Projects by Priority',
    },
  };

  const projectsByPrioritySeries = priorityCounts;

  return (
    <div style={styles.dashboard}>
      <h1 style={styles.title}>Dashboard</h1>
      <div style={styles.chartContainer}>
        <div style={styles.chart}>
          <Chart
            options={projectsByDateOptions}
            series={projectsByDateSeries}
            type="bar"
            height={350}
          />
        </div>
        <div style={styles.chart}>
          <Chart
            options={projectsByPriorityOptions}
            series={projectsByPrioritySeries}
            type="pie"
            height={350}
          />
        </div>
      </div>
    </div>
  );
};

const styles = {
  dashboard: {
    padding: '20px',
  },
  title: {
    textAlign: 'center',
    marginBottom: '20px',
  },
  chartContainer: {
    display: 'flex',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
  },
  chart: {
    flex: '1 1 45%',
    margin: '10px',
  },
};

export default Dashboard;