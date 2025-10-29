import React from 'react';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary';
};

const baseStyles =
  'px-4 py-2 rounded-lg font-semibold transition focus:outline-none focus:ring-2 focus:ring-offset-2';

const variants = {
  primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-600',
  secondary: 'bg-blue-100 text-blue-900 hover:bg-blue-200 focus:ring-blue-300',
};

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  className = '',
  ...props
}) => (
  <button
    className={`${baseStyles} ${variants[variant]} ${className}`}
    {...props}
  >
    {children}
  </button>
);

export default Button;