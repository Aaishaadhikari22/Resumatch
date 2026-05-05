import "./LoadingSpinner.css";

const LoadingSpinner = ({ size = "medium", color = "#2563eb" }) => {
  return (
    <div className="spinner-container">
      <div 
        className={`spinner ${size}`} 
        style={{ borderTopColor: color }}
      ></div>
    </div>
  );
};

export default LoadingSpinner;
