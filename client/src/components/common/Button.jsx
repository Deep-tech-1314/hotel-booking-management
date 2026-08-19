import React from 'react';

const Button = ({
  children,
  type = 'button',
  variant = 'primary', // primary, secondary, success, danger, ghost
  size = 'base', // sm, base, lg
  icon,
  className = '',
  disabled = false,
  loading = false,
  onClick,
  ...props
}) => {
  const baseClasses = 'btn';
  const variantClasses = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    success: 'btn-success',
    danger: 'btn-danger',
    ghost: 'btn-ghost',
  };
  const sizeClasses = {
    sm: 'btn-sm',
    base: '',
    lg: 'btn-lg',
  };

  const classes = `${baseClasses} ${variantClasses[variant] || variantClasses.primary} ${sizeClasses[size] || ''} ${className}`;

  return (
    <button
      type={type}
      className={classes}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
      {loading ? (
        <span className="loader" style={{ width: '16px', height: '16px', borderWidth: '2px' }}></span>
      ) : (
        <>
          {icon && <span className="btn-icon-inner">{icon}</span>}
          {children}
        </>
      )}
    </button>
  );
};

export default Button;
