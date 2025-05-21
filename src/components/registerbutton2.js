
import React from "react";
import { useNavigate } from 'react-router-dom';

const RegisterButton2 = ({ number }) => { // استقبال القيمة كـ prop
  const navigate = useNavigate();

  const handleClick = () => {
      // تمرير القيمة إلى صفحة SignUpOwner عبر state
      navigate('/registerowner', { state: { number } });
   
  };

  return (
    <div className="d-flex justify-content-end w-100 px-3">
   
      <button className="btn btn-custom px-4 py-2" onClick={handleClick}>
        Register as a onwer
      </button>
 
  
  </div>
  
  );
};

export default RegisterButton2;

