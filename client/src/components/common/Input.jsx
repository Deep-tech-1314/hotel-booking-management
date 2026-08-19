import React, { forwardRef } from 'react';

const Input = forwardRef(({
  label,
  type = 'text',
  name,
  value,
  onChange,
  placeholder,
  error,
  required = false,
  className = '',
  icon,
  ...props
}, ref) => {
  const id = `input-${name}`;

  return (
    <div className={`form-group ${className}`}>
      {label && (
        <label htmlFor={id} className="form-label">
          {label} {required && <span className="text-danger">*</span>}
        </label>
      )}
      <div style={{ position: 'relative' }}>
        {icon && (
          <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
            {icon}
          </div>
        )}
        <input
          ref={ref}
          id={id}
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          className={`form-input ${error ? 'border-danger' : ''}`}
          style={icon ? { paddingLeft: '40px' } : {}}
          {...props}
        />
      </div>
      {error && <div className="form-error">{error}</div>}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
