import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import Banner from '../../src/components/Banner';
import BandPill from '../../src/components/BandPill';
import Card from '../../src/components/Card';
import DataTable from '../../src/components/DataTable';
import Field from '../../src/components/Field';
import FileChip from '../../src/components/FileChip';
import KpiTile from '../../src/components/KpiTile';
import { copy } from '../../src/content/copy';

describe('Banner (spec 5)', () => {
  it('info: role=note with the sky dot', () => {
    const { container } = render(
      <Banner variant="info">
        <strong>Sample output.</strong> Layout only.
      </Banner>,
    );
    const note = screen.getByRole('note');
    expect(note).toHaveTextContent('Sample output. Layout only.');
    expect(note.className).toContain('bg-info-bg/90');
    expect(note.className).toContain('border-info-border');
    expect(container.querySelector('.bg-info-dot')).not.toBeNull();
  });

  it('warn: amber tokens, no dot', () => {
    const { container } = render(<Banner variant="warn">Careful.</Banner>);
    const note = screen.getByRole('note');
    expect(note.className).toContain('bg-warn-bg/80');
    expect(note.className).toContain('border-warn-border');
    expect(container.querySelector('.bg-info-dot')).toBeNull();
  });
});

describe('Card (spec 5)', () => {
  it('is a section labelled by its heading', () => {
    render(<Card title="The loan">fields</Card>);
    const section = screen.getByRole('region', { name: 'The loan' });
    expect(section.tagName).toBe('SECTION');
    const heading = screen.getByRole('heading', { level: 2, name: 'The loan' });
    expect(section.getAttribute('aria-labelledby')).toBe(heading.id);
    expect(section.className).toContain('shadow-card');
  });
});

describe('Field (spec 5)', () => {
  it('links label, helper and error to the control', () => {
    render(
      <Field
        id="amount"
        label="Loan amount requested"
        helper="Enter 0 if there is no bureau record."
        error={copy.score.validationExample}
      >
        <input className="w-full rounded-xl border border-slate-300" />
      </Field>,
    );
    const input = screen.getByLabelText('Loan amount requested');
    expect(input).toHaveAttribute('id', 'amount');
    expect(input).toHaveAttribute('aria-describedby', 'amount-helper amount-error');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input.className).toContain('border-2 border-error');
    expect(screen.getByRole('alert')).toHaveTextContent(copy.score.validationExample);
    expect(screen.getByText('Enter 0 if there is no bureau record.')).toHaveAttribute(
      'id',
      'amount-helper',
    );
  });

  it('without error: no alert, no error border, helper only', () => {
    render(
      <Field id="income" label="Annual income" helper="Gross yearly income.">
        <input />
      </Field>,
    );
    const input = screen.getByLabelText('Annual income');
    expect(input).toHaveAttribute('aria-describedby', 'income-helper');
    expect(input).not.toHaveAttribute('aria-invalid');
    expect(input.className).not.toContain('border-error');
    expect(screen.queryByRole('alert')).toBeNull();
  });
});

describe('BandPill (spec 5)', () => {
  it.each([
    ['Approve', copy.batch.approve, 'bg-teal-50'],
    ['Review', copy.batch.review, 'bg-amber-100/90'],
    ['Reject', copy.batch.reject, 'bg-rose-50'],
  ] as const)('%s shows its text label and pill tokens', (band, label, token) => {
    render(<BandPill band={band} />);
    const pill = screen.getByText(label);
    expect(pill.className).toContain(token);
    expect(pill.className).toContain('rounded-full');
  });
});

describe('FileChip (spec 5)', () => {
  it('thin: amber chip with the Thin-file label', () => {
    render(<FileChip thin />);
    const chip = screen.getByText(copy.report.thinFile);
    expect(chip.className).toContain('bg-amber-50');
    expect(chip.className).toContain('rounded-full');
  });

  it('thick: plain muted text, no chip', () => {
    render(<FileChip thin={false} />);
    const chip = screen.getByText(copy.report.thickFile);
    expect(chip.className).toContain('text-muted');
    expect(chip.className).not.toContain('rounded-full');
  });
});

describe('KpiTile (spec 5)', () => {
  it.each(['neutral', 'approve', 'review', 'reject'] as const)(
    '%s tone renders label, value and sub',
    (tone) => {
      render(<KpiTile tone={tone} label="Applicants scored" value={1000} sub="31.2% of file" />);
      expect(screen.getByText('Applicants scored')).toBeInTheDocument();
      expect(screen.getByText('1000')).toBeInTheDocument();
      expect(screen.getByText('31.2% of file')).toBeInTheDocument();
    },
  );

  it('approve tone uses the teal tile tokens', () => {
    const { container } = render(<KpiTile tone="approve" label="Approve" value="540" />);
    const tile = container.firstElementChild as HTMLElement;
    expect(tile.className).toContain('bg-teal-50/60');
    expect(tile.className).toContain('border-teal-200/80');
  });
});

describe('DataTable (spec 5)', () => {
  const columns = ['Rank', 'Applicant', 'Risk estimate'];
  const rows = [
    [1, 'A-001', '4.2%'],
    [2, 'A-002', '9.8%'],
  ];

  it('uses th scope=col for headers and th scope=row for the first column', () => {
    render(<DataTable columns={columns} rows={rows} />);
    const colHeaders = screen.getAllByRole('columnheader');
    expect(colHeaders).toHaveLength(3);
    const rowHeaders = screen.getAllByRole('rowheader');
    expect(rowHeaders).toHaveLength(2);
    expect(rowHeaders[0]).toHaveTextContent('1');
  });

  it('never puts flex on a td/th (inner inline-flex span is the pattern)', () => {
    const { container } = render(
      <DataTable
        columns={columns}
        rows={[[<span className="inline-flex items-center gap-1">cell</span>, 'x', 'y']]}
      />,
    );
    const cells = container.querySelectorAll('td, th');
    expect(cells.length).toBeGreaterThan(0);
    for (const cell of cells) {
      expect(cell.classList.contains('flex')).toBe(false);
      expect(cell.classList.contains('inline-flex')).toBe(false);
    }
    expect(container.querySelector('th .inline-flex')).not.toBeNull();
  });

  it('right-aligns numeric columns when asked', () => {
    render(<DataTable columns={columns} rows={rows} align={['left', 'left', 'right']} />);
    const cells = screen.getAllByRole('cell');
    expect(cells[1].className).toContain('text-right');
    expect(cells[0].className).toContain('text-left');
  });

  it('wraps the table in a horizontal scroll container', () => {
    const { container } = render(<DataTable columns={columns} rows={rows} />);
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.className).toContain('overflow-x-auto');
  });
});
