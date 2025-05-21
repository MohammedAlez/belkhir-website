
import React from "react";
import { useNavigate } from 'react-router-dom';

const RegisterButton = ({ number }) => { // استقبال القيمة كـ prop
  const navigate = useNavigate();

  const handleClick = () => {
    if (number === 0) {
      // تمرير القيمة إلى صفحة SignUpOwner عبر state
      navigate('/register', { state: { number } });
    } else {
    
      console.log("لم يتم تمرير رقم!");
      navigate('/login');
    }
  };

  return (
    <div className="d-flex justify-content-end  w-100 px-3 m-4">
    {number === 0 ? (
      <button className="btn btn-custom px-4 py-2" onClick={handleClick}>
        Register 
      </button>
    ):(
        <button className="btn btn-custom px-4 py-2" onClick={handleClick}>
login       </button> 
    )}
  </div>
  
  );
};

export default RegisterButton;

