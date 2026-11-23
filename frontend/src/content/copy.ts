import { REPO_URL, THIN_FILE_DEFINITION, THIN_FILE_SHORT } from "../config/project";

/**
 * All user-facing copy, character-for-character from Frontend Master Spec v1.1
 * sections 6, 7 and 8. Do not reword, shorten or translate.
 *
 * {TOKEN} placeholders are kept verbatim and filled at render time via fill()
 * from config/project.ts or /api/meta — never retyped here.
 */

/** Substitute {token} placeholders; unknown tokens are left untouched. */
export function fill(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    Object.prototype.hasOwnProperty.call(values, key) ? String(values[key]) : match,
  );
}

/** Fallback values for the section 11 placeholders, sourced from config. */
export const placeholderDefaults = {
  REPO_URL,
  thin_file_definition: THIN_FILE_DEFINITION,
  thin_file_short: THIN_FILE_SHORT,
} as const;

export const copy = {
  // ---- 7.1 Global -------------------------------------------------------
  topBanner:
    "Research demo. Not a lending decision. Nothing here is a real score or a real applicant.",
  footer:
    "Research and portfolio project. Uses the Home Credit Default Risk dataset from Kaggle under Kaggle's competition rules. Not affiliated with Home Credit or Kaggle. Source: {REPO_URL}",

  // ---- 7.2 Home ---------------------------------------------------------
  home: {
    eyebrow: "Research demo · Credit risk",
    h1: "Does a credit model work for people with no credit history?",
    lead: "Lenders score applicants from their past borrowing. Applicants with little or none, called thin-file, are the hardest to score. This project trains a default-prediction model, then tests how well it does for them and how well it explains itself.",
    tryDemo: "Try the demo",
    readReport: "Read the model report",
    whatYouCanDo: "What you can do here",
    links: [
      {
        title: "Score one applicant",
        description: "Enter a few details and see a risk estimate and the factors behind it.",
      },
      {
        title: "Score a file of applicants",
        description:
          "Upload a CSV, set cutoffs, and get a ranked list in approve, review and reject bands.",
      },
      {
        title: "Read the evaluation",
        description:
          "Performance for thin-file and thick-file applicants, calibration, fairness checks and limits.",
      },
    ],
    howItWorks: "How it works",
    steps: [
      {
        title: "Train",
        text: "A gradient-boosted model learns from past loan applications where the repayment outcome is known.",
      },
      {
        title: "Segment",
        text: "Applicants are split into thin-file and thick-file by bureau history. The rule is fixed before looking at outcomes.",
      },
      {
        title: "Explain",
        text: "Every score comes with the inputs that pushed it up or down, calculated with SHAP.",
      },
      {
        title: "Check",
        text: "Accuracy, calibration and error rates are reported per group, including gender and age bands.",
      },
    ],
    whatThisIsNot: "What this is not",
    notItems: [
      {
        lead: "Not a lending tool.",
        text: "It must not be used to approve or reject a real applicant.",
      },
      {
        lead: "Not every loan type.",
        text: "The model covers only the loan types in its training data, to be confirmed once the data is inspected. It is not a home-loan model.",
      },
      {
        lead: "Not Indian borrower data.",
        text: "The model is trained on Home Credit applications from a Kaggle competition.",
      },
      {
        lead: "Not trained yet.",
        text: "Every number in this mockup is sample output that shows layout only.",
      },
      {
        lead: "Not shipped with data.",
        text: "The data's licence limits its use, so this project distributes no data and no trained model. You train it yourself from your own download.",
      },
    ],
  },

  // ---- 7.3 Score + 6.2 --------------------------------------------------
  score: {
    h1: "Score an applicant",
    lead: "Enter a few details about a loan application. You get a risk estimate, a note on whether the applicant is thin-file, and the main factors behind the number.",
    whatYouGetBack: "What you get back",
    getBack: [
      "An estimated chance of repayment difficulty",
      "Whether the applicant counts as thin-file, and how that affects confidence",
      "The inputs that pushed the estimate up or down",
    ],
    goodToKnow: "Good to know",
    goodToKnowItems: [
      "Gender and age are not inputs to the model.",
      "No applications from the training data are shown anywhere in this demo.",
      "This is a research and portfolio project, not a lender's tool.",
    ],
    provisionalFieldsNote:
      "**Provisional fields.** The final input list follows the real feature set once the data has been inspected.",
    provisionalOptions: "Provisional options. The final list comes from the real data.",
    fieldsets: ["The loan", "The applicant", "Past loans"],
    fieldLabels: [
      "Loan type",
      "Loan amount requested",
      "Monthly repayment",
      "Price of the goods being financed",
      "Annual income",
      "Years in current job",
      "Months of credit-bureau history",
      "Previous loans with this lender",
      "Previous late payments",
    ],
    fieldPlaceholders: {
      loanAmount: "e.g. 250000",
      monthlyRepayment: "e.g. 12000",
      goodsPrice: "e.g. 225000",
      annualIncome: "e.g. 180000",
      jobTenure: "e.g. 3",
      bureauHistory: "0 if none",
      previousLoans: "e.g. 1",
      latePayments: "e.g. 0",
    },
    bureauHistoryHelper:
      "Enter 0 if there is no bureau record. This is what marks a thin-file applicant.",
    estimateRisk: "Estimate risk",
    previewNote: "Preview: this opens a sample result.",
    estimating: "Estimating…",
    validationExample: "Enter a number of 0 or more.",
    submitError: "Could not get an estimate. Check the values and try again.",
  },

  // ---- 6.3 Result (7.4 points here) -------------------------------------
  result: {
    sampleBannerLabel: "Sample output",
    h1: "Result",
    estimateEyebrow: "Estimated chance of repayment difficulty",
    sampleRangeLine: "Sample range for this applicant: …",
    rangePrefix: "Range for this applicant:",
    bandCutoffsNote: "Band cutoffs are illustrative assumptions, not lender policy.",
    thinFileApplicant: "Thin-file applicant",
    whyModelSaidThis: "Why the model said this",
    scoreAnother: "Score another applicant",
    seeReliability: "See how reliable the model is",
    riskBarLabels: ["Lower (under 10%)", "Moderate (10–20%)", "Higher (over 20%)"],
    factorIntro:
      "How each input moved the estimate away from an average applicant. Sample values, in percentage points.",
    raisesEstimate: "Raises the estimate (+)",
    lowersEstimate: "Lowers the estimate (−)",
    allOtherInputs: "All other inputs combined",
    factorFootnote:
      "These bars describe how the model reached its number. They are not evidence of why a person might struggle to repay.",
    reconciliationLabels: {
      average: "Average applicant",
      sumFactors: "Sum of all factors",
      thisApplicant: "This applicant",
    },
  },

  // ---- 7.5 Thin-file card -----------------------------------------------
  thinFileCard:
    "This applicant is thin-file under this project's rule: {thin_file_short}. The model has less to go on here, so treat the estimate as less certain and read the range, not just the single number.",
  thinFileCardNoRangeClause: "and read the range, not just the single number",

  // ---- 7.6 Batch + 6.4 --------------------------------------------------
  batch: {
    sampleBanner:
      "**Sample output.** This screen shows layout only. The applicants and risk numbers below are placeholders. The cutoff sliders work on an illustrative sample of 1,000 applicants.",
    h1: "Batch scoring",
    lead: "Score a whole file of applications at once. You get a ranked list, risk bands, and how many applicants fall into approve, review and reject at the cutoffs you choose.",
    uploadHeading: "1. Upload applicants",
    cutoffsHeading: "2. Set the cutoffs",
    resultsHeading: "3. Results",
    applicantFile: "Applicant file (CSV)",
    chooseFile: "Choose File",
    uploadHelper:
      "One row per applicant. Columns must match the model's input fields. This demo ships no sample data, so bring your own file.",
    downloadTemplate: "Download blank column template (CSV)",
    approveBelow: "Approve below",
    rejectAbove: "Reject above",
    cutoffsHelper:
      "Anything between the two goes to review. Cutoffs are illustrative assumptions, not lender policy.",
    emptyState: "Upload a file to see results.",
    applicantsScored: "Applicants scored",
    applicantsScoredSample: "Applicants scored (sample)",
    approve: "Approve",
    review: "Review",
    reject: "Reject",
    thinSub: "{n_thin} thin-file ({pct}%)",
    pctOfFileSub: "{pct}% of file",
    stackedBarAria:
      "Stacked bar showing the share of applicants in approve, review and reject bands",
    riskDistribution: "Risk distribution",
    histogramHelper:
      "How many applicants fall at each risk level, on an illustrative sample of 1,000. Bars change colour as you move the cutoffs.",
    thisFile: "this file",
    rankedList: "Ranked list, lowest risk first",
    downloadRanked: "Download ranked list (CSV)",
    axisTitle: "Estimated risk of repayment difficulty",
    axisTicks: ["0%", "10%", "20%", "30%", "40%+"],
    yourCutoffs: "Your cutoffs",
    tableColumns: ["Rank", "Applicant", "Risk estimate", "Decision band", "File", "Main reason"],
    previous: "Previous",
    next: "Next",
    showing: "Showing {a}–{b} of {n}",
    footnoteSample:
      "Showing 7 sample rows of 1,000. The real list shows every applicant in the file. Thin-file applicants are flagged because their estimates are less certain, so a review band is not a rejection.",
    footnoteReal:
      "Thin-file applicants are flagged because their estimates are less certain, so a review band is not a rejection.",
    dash: "—",
    tooLarge: "That file is too large for this demo.",
    scoring: "Scoring…",
    andNMore: "and N more",
    csvHeader: "rank,applicant_id,risk_percent,band,file_type,main_reason",
    csvFilename: "ranked-applicants.csv",
  },

  // ---- 6.5 Report + 7.7 -------------------------------------------------
  report: {
    h1: "Model report",
    lead: "How well the model works, for whom, and where it should not be trusted.",
    untrainedBanner:
      "**No model has been trained yet.** Dashes below fill in from the held-out evaluation once training is done. Nothing on this page is a result.",
    performanceTitle: "Performance by applicant group",
    performanceHelper:
      "The main question: does the model work as well for thin-file applicants as for everyone else? Intervals are shown where a group is small.",
    performanceColumns: [
      "Group",
      "Applicants",
      "Default rate",
      "ROC-AUC",
      "PR-AUC",
      "KS",
      "Calibration error",
      "95% interval (AUC)",
    ],
    thinFile: "Thin-file",
    thickFile: "Thick-file",
    allApplicants: "All applicants",
    inconclusive: "Inconclusive",
    inconclusiveNote:
      "The thin-file group is too small for a firm answer. The group definition was not changed to get a result.",
    calibrationTitle: "Calibration",
    calibrationHelper:
      "When the model says 20%, do about 20% of those applicants really struggle? Points near the dashed line mean yes.",
    fairnessTitle: "Fairness checks",
    fairnessHelper:
      "Gender and age are not model inputs, but the model can still treat groups differently. Large gaps are reported as findings, not hidden.",
    fairnessColumns: ["Group", "Error rate", "Calibration gap"],
    fairnessMockRows: ["By gender", "By age band", "Thin vs thick file"],
    evaluatedTitle: "How it will be evaluated",
    evaluated: [
      { lead: "Thin-file rule:", text: "{thin_file_definition}" },
      {
        lead: "Main metric:",
        text: "ROC-AUC, to be confirmed against the competition page. Also reported: PR-AUC, KS, Brier score and calibration.",
      },
      {
        lead: "Small groups:",
        text: `95% bootstrap intervals. If the thin-file group is too small for a firm answer, the report says "inconclusive" and does not redefine the group to get a result.`,
      },
      {
        lead: "Fairness:",
        text: "error rates and calibration compared across gender and age bands. Gaps are reported as findings; no mitigation is claimed.",
      },
    ],
    limitsTitle: "Limits you should know about",
    limits: [
      "The model is trained on Home Credit applications from a Kaggle competition. It does not describe Indian borrowers.",
      "The data is used under Kaggle's competition rules, so this project ships no data and no trained model file. You train it yourself from your own download.",
      "The data may not include application dates, so evaluation uses random splits, not a test that moves forward in time.",
      "The thin-file group may be too small for firm conclusions.",
      "Risk bands and cutoffs are illustrative assumptions, not lender policy.",
      "This is a research and portfolio project. It must not be used to approve or reject a real applicant.",
    ],
    predictedRisk: "Predicted risk",
    observedDefaultRate: "Observed default rate",
    calibrationEmpty: "Chart appears after evaluation",
    calibrationEmptyAria:
      "Empty calibration chart with a dashed diagonal reference line, to be filled after evaluation",
    calibrationAria: "Calibration chart: predicted risk versus observed default rate by group",
  },

  // ---- 6.6 NotFound -----------------------------------------------------
  notFound: "Page not found",

  // ---- 8. States --------------------------------------------------------
  states: {
    loadError: "Something went wrong loading this. Try again.",
    retry: "Retry",
    serviceUnavailable: "The scoring service is not available right now.",
    batchEmpty: "Upload a file to see results.",
  },
} as const;
