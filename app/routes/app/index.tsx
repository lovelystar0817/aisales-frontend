import { useEffect } from 'react';
import { useNavigate } from 'react-router';

export default function AppIndex() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate('/home');
  }, [navigate]);

  return null;
}