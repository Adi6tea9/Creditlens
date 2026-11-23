import { cloneElement, type ReactElement } from 'react';

interface FieldProps {
  id: string;
  label: string;
  helper?: string;
  error?: string;
  /** The control (input/select); Field wires id, aria-describedby and errors. */
  children: ReactElement;
}

/** Spec 5 — label above, helper/error below, error border on the control. */
export default function Field({ id, label, helper, error, children }: FieldProps) {
  const helperId = `${id}-helper`;
  const errorId = `${id}-error`;
  const describedBy =
    [helper ? helperId : null, error ? errorId : null].filter(Boolean).join(' ') || undefined;

  const control = cloneElement(children, {
    id,
    'aria-describedby': describedBy,
    'aria-invalid': error ? true : undefined,
    className: [children.props.className, error ? 'border-2 border-error' : '']
      .filter(Boolean)
      .join(' '),
  });

  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-xs font-semibold text-slate-700">
        {label}
      </label>
      {control}
      {helper && (
        <p id={helperId} className="mt-1.5 text-xs leading-snug text-slate-500">
          {helper}
        </p>
      )}
      {error && (
        <p id={errorId} role="alert" className="mt-1.5 text-xs text-error">
          {error}
        </p>
      )}
    </div>
  );
}
