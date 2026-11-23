import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';

import { postScore, useMock } from '../api/client';
import type { Meta } from '../api/schemas';
import { LoadingCard, StateError } from '../components/AsyncState';
import Banner from '../components/Banner';
import Card from '../components/Card';
import Field from '../components/Field';
import Page from '../components/Page';
import { copy } from '../content/copy';
import { useMeta } from '../hooks/useMeta';

type FieldSchema = Meta['fields'][number];
type Control = HTMLInputElement | HTMLSelectElement;

const controlClass =
  'w-full min-h-touch rounded-xl border border-input-border bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-500 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition-all';

function valid(field: FieldSchema, raw: string): boolean {
  if (raw.trim() === '') return !field.required;
  if (field.type === 'number') {
    const value = Number(raw);
    if (!Number.isFinite(value)) return false;
    if (field.min !== undefined && value < field.min) return false;
    if (field.max !== undefined && value > field.max) return false;
  }
  return true;
}

/** Section 7 strings carry their own **bold lead-in** markers. */
function BoldNote({ text }: { text: string }) {
  const [, lead, rest] = text.split('**');
  return (
    <>
      <strong>{lead}</strong>
      {rest}
    </>
  );
}

/** Spec 6.2 — schema-driven single-applicant form. */
export default function Score() {
  const navigate = useNavigate();
  const { meta, status: metaStatus, retry: retryMeta } = useMeta();
  const [values, setValues] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string>();
  const [lastSubmit, setLastSubmit] = useState<{
    payload: Record<string, number | string>;
    thinFileShort: string;
  }>();
  const controls = useRef<Record<string, Control | null>>({});

  useEffect(() => {
    if (meta) setValues(Object.fromEntries(meta.fields.map((field) => [field.id, ''])));
  }, [meta]);

  const groups = meta ? [...new Set(meta.fields.map((field) => field.group))] : [];

  function setError(field: FieldSchema, raw: string) {
    setErrors((current) => ({
      ...current,
      [field.id]: valid(field, raw) ? undefined : copy.score.validationExample,
    }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!meta || submitting) return;

    const nextErrors: Record<string, string> = {};
    let firstInvalid: string | undefined;
    for (const field of meta.fields) {
      if (!valid(field, values[field.id] ?? '')) {
        nextErrors[field.id] = copy.score.validationExample;
        firstInvalid ??= field.id;
      }
    }
    setErrors(nextErrors);
    if (firstInvalid) {
      controls.current[firstInvalid]?.focus();
      return;
    }

    submit(
      Object.fromEntries(
        meta.fields.map((field) => [
          field.id,
          field.type === 'number' ? Number(values[field.id]) : values[field.id],
        ]),
      ),
      meta.thin_file_short,
    );
  }

  function submit(payload: Record<string, number | string>, thinFileShort: string) {
    setSubmitting(true);
    setSubmitError(undefined);
    setLastSubmit({ payload, thinFileShort });
    postScore(payload)
      .then((result) =>
        navigate('/score/result', {
          state: { ...result, thin_file_short: thinFileShort },
        }),
      )
      .catch((error: unknown) => {
        const detail = (error as { detail?: unknown }).detail;
        setSubmitError(
          typeof detail === 'string' && detail
            ? `${copy.score.submitError} ${detail}`
            : copy.score.submitError,
        );
      })
      .finally(() => setSubmitting(false));
  }

  return (
    <>
      <div className="mb-2 space-y-1.5">
        <Page title={copy.score.h1} h1={copy.score.h1} />
        <p className="max-w-2xl text-sm sm:text-base text-slate-600">{copy.score.lead}</p>
      </div>

      <div className="flex flex-wrap items-start gap-6">
        <div className="min-w-0 flex-[999_1_560px] rounded-2xl border border-border/90 bg-surface p-6 shadow-card sm:p-8">
          {metaStatus === 'loading' && <LoadingCard rows={9} className="space-y-3" />}
          {metaStatus === 'error' && (
            <div className="space-y-4">
              <p className="text-sm text-error">{copy.score.metaFailure}</p>
              <StateError onRetry={retryMeta} className="" />
            </div>
          )}
          {meta && (
            <form noValidate onSubmit={handleSubmit} className="space-y-8">
              {submitError && (
                <StateError
                  message={submitError}
                  onRetry={() =>
                    lastSubmit && submit(lastSubmit.payload, lastSubmit.thinFileShort)
                  }
                  className="rounded-xl border-2 border-error px-4 py-3"
                />
              )}

              {groups.map((group) => {
                const fields = meta.fields.filter((field) => field.group === group);
                return (
                  <fieldset key={group}>
                    <legend className="mb-4 border-b border-slate-100 pb-2 text-base font-semibold">
                      {group}
                    </legend>
                    <div
                      className={`grid grid-cols-1 gap-4 sm:grid-cols-2 ${
                        fields.length > 2 ? 'lg:grid-cols-3' : ''
                      }`}
                    >
                      {fields.map((field) => {
                        const helper =
                          field.type === 'select'
                            ? meta.loan_types_final
                              ? undefined
                              : copy.score.provisionalOptions
                            : (field.helper ??
                              (field.id === 'bureau_history_months'
                                ? copy.score.bureauHistoryHelper
                                : undefined));
                        return (
                          <Field
                            key={field.id}
                            id={field.id}
                            label={field.label}
                            helper={helper}
                            error={errors[field.id]}
                          >
                            {field.type === 'select' ? (
                              <select
                                ref={(node) => {
                                  controls.current[field.id] = node;
                                }}
                                className={`${controlClass} appearance-none pr-9`}
                                style={{
                                  backgroundImage:
                                    "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748B' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E\")",
                                  backgroundRepeat: 'no-repeat',
                                  backgroundPosition: 'right 0.75rem center',
                                  backgroundSize: '1rem',
                                }}
                                value={values[field.id] ?? ''}
                                onChange={(event) => {
                                  setValues((current) => ({
                                    ...current,
                                    [field.id]: event.target.value,
                                  }));
                                }}
                                onBlur={() => setError(field, values[field.id] ?? '')}
                              >
                                <option value="">{field.label}</option>
                                {meta.loan_types.map((option) => (
                                  <option key={option.value} value={option.value}>
                                    {option.label}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <input
                                ref={(node) => {
                                  controls.current[field.id] = node;
                                }}
                                type="number"
                                inputMode="decimal"
                                min={field.min}
                                max={field.max}
                                step={field.step}
                                placeholder={field.placeholder}
                                className={`${controlClass} tabular-nums`}
                                value={values[field.id] ?? ''}
                                onChange={(event) => {
                                  setValues((current) => ({
                                    ...current,
                                    [field.id]: event.target.value,
                                  }));
                                }}
                                onBlur={() => setError(field, values[field.id] ?? '')}
                              />
                            )}
                          </Field>
                        );
                      })}
                    </div>
                  </fieldset>
                );
              })}

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  aria-busy={submitting}
                  className="inline-flex min-h-touch items-center justify-center rounded-xl bg-primary-hover px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-teal-800 disabled:opacity-60"
                >
                  {submitting ? copy.score.estimating : copy.score.estimateRisk}
                </button>
                {useMock() && (
                  <span className="text-xs text-slate-500">{copy.score.previewNote}</span>
                )}
              </div>
            </form>
          )}
        </div>

        {meta && (
          <div className="min-w-0 flex-[1_1_300px] space-y-5">
            <Card title={copy.score.whatYouGetBack}>
              <ul className="list-disc space-y-2.5 pl-4 text-sm leading-relaxed text-slate-600 marker:text-teal-600">
                {copy.score.getBack.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </Card>
            <Card title={copy.score.goodToKnow}>
              <ul className="list-disc space-y-2.5 pl-4 text-sm leading-relaxed text-slate-600 marker:text-teal-600">
                {copy.score.goodToKnowItems.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </Card>
            {!meta.fields_final && (
              <Banner variant="info">
                <BoldNote text={copy.score.provisionalFieldsNote} />
              </Banner>
            )}
          </div>
        )}
      </div>
    </>
  );
}
