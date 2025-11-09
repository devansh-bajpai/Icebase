import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children }) {
  const token = localStorage.getItem("token");
  
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
}
<<<<<<< HEAD

=======
>>>>>>> 9ede3a764bdda6eb40b24e7bf98e491e9593fcc3
