import React, { useEffect, useState } from 'react';
import Dashboard from '../components/Dashboard';
import { fetchProjects } from '../api'; // Assuming you have an API function to fetch projects

const DashboardPage = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProjects = async () => {
      try {
        const response = await fetchProjects(); // Fetch projects from the API
        setProjects(response.data);
      } catch (error) {
        console.error('Error fetching projects:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProjects();
  }, []);

  if (loading) {
    return <p>Loading...</p>;
  }

  return (
    <div>
      <Dashboard projects={projects} />
    </div>
  );
};

export default DashboardPage;