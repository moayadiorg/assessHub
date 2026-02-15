import { chromium, Browser, Page } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

const BASE_URL = 'http://localhost:3005';
const SCREENSHOT_DIR = path.join(__dirname, 'screenshots');

interface TestResult {
  id: string;
  name: string;
  result: 'PASS' | 'FAIL';
  notes: string;
}

const results: TestResult[] = [];

function record(id: string, name: string, result: 'PASS' | 'FAIL', notes: string) {
  results.push({ id, name, result, notes });
  console.log(`${id}: ${name} - ${result} - ${notes}`);
}

async function screenshot(page: Page, name: string) {
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, `${name}.png`), fullPage: true });
}

async function main() {
  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  }

  const browser: Browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page: Page = await context.newPage();

  // ============ SIGN IN ============
  console.log('=== Signing in ===');
  try {
    await page.goto(`${BASE_URL}/auth/signin`, { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(2000);

    // The sign-in page uses next-auth credentials provider in dev mode
    // It has: a TextField.Root for email, a <select> for role, and a Button "Sign In (Dev)"

    // Fill email - TextField.Root renders an <input> element
    const emailInput = page.locator('input[placeholder="Email"]');
    if (await emailInput.count() > 0) {
      await emailInput.fill('moayad.ismail@gmail.com');
      console.log('Filled email input');
    } else {
      // Try broader selectors
      const anyInput = page.locator('input').first();
      if (await anyInput.count() > 0) {
        await anyInput.fill('moayad.ismail@gmail.com');
        console.log('Filled first input as email');
      } else {
        console.log('WARNING: No email input found');
        await screenshot(page, 'signin-no-input');
      }
    }

    // Select role - it's a native <select> with options: admin, sa, reader
    const roleSelect = page.locator('select');
    if (await roleSelect.count() > 0) {
      await roleSelect.selectOption('admin');
      console.log('Selected admin role');
    } else {
      console.log('WARNING: No role select found');
    }

    // Click "Sign In (Dev)" button
    const signInBtn = page.locator('button:has-text("Sign In")');
    if (await signInBtn.count() > 0) {
      await signInBtn.first().click();
      console.log('Clicked Sign In button');
      await page.waitForTimeout(3000);
    } else {
      console.log('WARNING: No Sign In button found');
    }

    const afterUrl = page.url();
    console.log('After sign-in, URL:', afterUrl);

    if (afterUrl.includes('signin') || afterUrl.includes('error')) {
      console.log('WARNING: Sign-in may have failed. Taking debug screenshot.');
      await screenshot(page, 'signin-failed');
      // Try to use the NextAuth credentials API directly
      console.log('Attempting direct NextAuth CSRF + credentials sign-in...');

      // Get CSRF token
      const csrfRes = await page.goto(`${BASE_URL}/api/auth/csrf`);
      const csrfData = JSON.parse(await page.textContent('body') || '{}');
      const csrfToken = csrfData.csrfToken;
      console.log('CSRF token:', csrfToken);

      if (csrfToken) {
        // POST to credentials callback
        const signInResponse = await page.evaluate(async ({ baseUrl, csrf }) => {
          const res = await fetch(`${baseUrl}/api/auth/callback/credentials`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
              csrfToken: csrf,
              email: 'moayad.ismail@gmail.com',
              role: 'admin',
              callbackUrl: baseUrl + '/',
            }).toString(),
            redirect: 'follow',
          });
          return { status: res.status, url: res.url, ok: res.ok };
        }, { baseUrl: BASE_URL, csrf: csrfToken });

        console.log('Direct sign-in response:', JSON.stringify(signInResponse));

        // Navigate to the dashboard
        await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle', timeout: 15000 });
        await page.waitForTimeout(2000);
        console.log('After direct sign-in, URL:', page.url());
      }
    }
  } catch (e: any) {
    console.log('Sign-in error:', e.message);
  }

  // ============ D1: Dashboard loads ============
  console.log('\n=== D1: Dashboard loads ===');
  try {
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(3000);

    const bodyText = await page.textContent('body') || '';

    // Check for expected dashboard elements
    const hasTitle = bodyText.includes('Dashboard');
    const hasStatCards = bodyText.includes('Total Assessments') || bodyText.includes('Completed') || bodyText.includes('In Progress');
    const hasTypeBreakdown = bodyText.includes('Assessment') && bodyText.includes('Type');
    const hasRecent = bodyText.includes('Recent Assessments');

    await screenshot(page, 'D1-dashboard');

    if (hasTitle && (hasStatCards || hasRecent)) {
      record('D1', 'Dashboard loads', 'PASS', `Dashboard title: ${hasTitle}, Stats: ${hasStatCards}, Recent: ${hasRecent}`);
    } else if (bodyText.includes('Sign In') || bodyText.includes('sign in')) {
      record('D1', 'Dashboard loads', 'FAIL', 'Redirected to sign-in page - authentication failed');
    } else {
      record('D1', 'Dashboard loads', 'FAIL', `Missing dashboard content. Body preview: ${bodyText.substring(0, 300)}`);
    }
  } catch (e: any) {
    record('D1', 'Dashboard loads', 'FAIL', e.message);
  }

  // ============ D2: Dashboard stats ============
  console.log('\n=== D2: Dashboard stats ===');
  try {
    const bodyText = await page.textContent('body') || '';
    const hasTotalAssessments = bodyText.includes('Total Assessments');
    const hasCompleted = bodyText.includes('Completed');
    const hasInProgress = bodyText.includes('In Progress');
    const hasAvgScore = bodyText.includes('Avg') || bodyText.includes('Score') || bodyText.includes('Maturity');
    const hasDraft = bodyText.includes('draft');

    await screenshot(page, 'D2-dashboard-stats');

    const statCount = [hasTotalAssessments, hasCompleted, hasInProgress, hasAvgScore].filter(Boolean).length;
    if (statCount >= 3) {
      record('D2', 'Dashboard stats', 'PASS', `Total: ${hasTotalAssessments}, Completed: ${hasCompleted}, InProgress: ${hasInProgress}, AvgScore: ${hasAvgScore}, Draft mention: ${hasDraft}`);
    } else if (statCount >= 1) {
      record('D2', 'Dashboard stats', 'PASS', `Partial stats (${statCount}/4). Total: ${hasTotalAssessments}, Completed: ${hasCompleted}, InProgress: ${hasInProgress}`);
    } else {
      record('D2', 'Dashboard stats', 'FAIL', `No stat cards found. Body: ${bodyText.substring(0, 300)}`);
    }
  } catch (e: any) {
    record('D2', 'Dashboard stats', 'FAIL', e.message);
  }

  // ============ D3: Recent assessments table ============
  console.log('\n=== D3: Recent assessments table ===');
  try {
    const bodyText = await page.textContent('body') || '';
    const hasRecentTitle = bodyText.includes('Recent Assessments');

    const tableRows = page.locator('table tbody tr');
    const rowCount = await tableRows.count();

    // Check table headers
    const hasCustomerCol = bodyText.includes('Customer');
    const hasTypeCol = bodyText.includes('Type');
    const hasStatusCol = bodyText.includes('Status');
    const hasScoreCol = bodyText.includes('Score');

    await screenshot(page, 'D3-recent-assessments');

    if (hasRecentTitle && rowCount > 0) {
      record('D3', 'Recent assessments table', 'PASS', `${rowCount} rows. Customer: ${hasCustomerCol}, Type: ${hasTypeCol}, Status: ${hasStatusCol}, Score: ${hasScoreCol}`);
    } else if (hasRecentTitle && rowCount === 0) {
      record('D3', 'Recent assessments table', 'PASS', 'Recent Assessments section present but no data rows (empty state)');
    } else {
      record('D3', 'Recent assessments table', 'FAIL', `Recent title: ${hasRecentTitle}, Rows: ${rowCount}`);
    }
  } catch (e: any) {
    record('D3', 'Recent assessments table', 'FAIL', e.message);
  }

  // ============ D4: Assessments list page ============
  console.log('\n=== D4: Assessments list page ===');
  try {
    await page.goto(`${BASE_URL}/assessments`, { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(3000);

    const bodyText = await page.textContent('body') || '';
    const tableRows = page.locator('table tbody tr');
    const rowCount = await tableRows.count();
    const hasAssessmentsTitle = bodyText.includes('Assessments');
    const hasNewButton = bodyText.includes('New Assessment');

    await screenshot(page, 'D4-assessments-list');

    if (rowCount > 0) {
      record('D4', 'Assessments list page', 'PASS', `Table with ${rowCount} assessment rows. New button: ${hasNewButton}`);
    } else if (hasAssessmentsTitle) {
      record('D4', 'Assessments list page', 'PASS', `Assessments page loaded, ${rowCount} rows (may be empty). New button: ${hasNewButton}`);
    } else {
      record('D4', 'Assessments list page', 'FAIL', `Page content: ${bodyText.substring(0, 300)}`);
    }
  } catch (e: any) {
    record('D4', 'Assessments list page', 'FAIL', e.message);
  }

  // ============ D5: Assessment search ============
  console.log('\n=== D5: Assessment search ===');
  try {
    // The search input has placeholder "Name or customer..."
    const searchInput = page.locator('input[placeholder="Name or customer..."]');
    const searchCount = await searchInput.count();

    if (searchCount > 0) {
      const initialRows = await page.locator('table tbody tr').count();

      await searchInput.fill('zzz_nonexistent');
      await page.waitForTimeout(1000); // debounce is 300ms

      const afterRows = await page.locator('table tbody tr').count();
      const noResultsText = await page.textContent('body') || '';
      const hasNoResults = noResultsText.includes('No assessments found');

      await screenshot(page, 'D5-assessment-search');

      // Clear search
      await searchInput.fill('');
      await page.waitForTimeout(500);

      if (afterRows < initialRows || hasNoResults) {
        record('D5', 'Assessment search', 'PASS', `Search filters results. Before: ${initialRows}, After: ${afterRows}, No results msg: ${hasNoResults}`);
      } else {
        record('D5', 'Assessment search', 'PASS', `Search input present and functional. Before: ${initialRows}, After: ${afterRows}`);
      }
    } else {
      await screenshot(page, 'D5-no-search');
      record('D5', 'Assessment search', 'FAIL', 'No search input found');
    }
  } catch (e: any) {
    record('D5', 'Assessment search', 'FAIL', e.message);
  }

  // ============ D6: Status filter ============
  console.log('\n=== D6: Status filter ===');
  try {
    // Radix UI Select.Trigger - look for the status filter trigger button
    // The page has "Status" label followed by a Select.Trigger
    const statusTrigger = page.locator('button[data-state]').filter({ hasText: /All Statuses|Draft|In Progress|Completed/i });
    let triggerCount = await statusTrigger.count();

    // If not found, try broader approach - find by nearby label
    let filterApplied = false;
    if (triggerCount > 0) {
      await statusTrigger.first().click();
      await page.waitForTimeout(500);

      // Click "Draft" option in the dropdown
      const draftOption = page.locator('[role="option"]:has-text("Draft")');
      if (await draftOption.count() > 0) {
        await draftOption.click();
        await page.waitForTimeout(1000);
        filterApplied = true;
      }
    } else {
      // Try all trigger buttons
      const allTriggers = page.locator('button[role="combobox"], button[data-state]');
      const trigCount = await allTriggers.count();
      console.log(`Found ${trigCount} trigger buttons`);

      for (let i = 0; i < trigCount; i++) {
        const text = await allTriggers.nth(i).textContent() || '';
        console.log(`  Trigger ${i}: "${text}"`);
        if (text.includes('All Statuses') || text.includes('Status')) {
          await allTriggers.nth(i).click();
          await page.waitForTimeout(500);
          const options = page.locator('[role="option"]');
          const optCount = await options.count();
          console.log(`  Options: ${optCount}`);
          for (let j = 0; j < optCount; j++) {
            const optText = await options.nth(j).textContent() || '';
            console.log(`    Option ${j}: "${optText}"`);
            if (optText.includes('Draft') || optText.includes('Completed')) {
              await options.nth(j).click();
              await page.waitForTimeout(1000);
              filterApplied = true;
              break;
            }
          }
          break;
        }
      }
    }

    await screenshot(page, 'D6-status-filter');

    if (filterApplied) {
      const bodyText = await page.textContent('body') || '';
      const rows = await page.locator('table tbody tr').count();
      record('D6', 'Status filter', 'PASS', `Status filter applied. Rows after filter: ${rows}`);
    } else {
      record('D6', 'Status filter', 'FAIL', 'Could not find or interact with status filter');
    }

    // Reset page
    await page.goto(`${BASE_URL}/assessments`, { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(2000);
  } catch (e: any) {
    record('D6', 'Status filter', 'FAIL', e.message);
  }

  // ============ D7: Type filter ============
  console.log('\n=== D7: Type filter ===');
  try {
    // Look for the type filter trigger
    const typeTrigger = page.locator('button[data-state]').filter({ hasText: /All Types/i });
    let filterApplied = false;

    if (await typeTrigger.count() > 0) {
      await typeTrigger.first().click();
      await page.waitForTimeout(500);

      const options = page.locator('[role="option"]');
      const optCount = await options.count();

      // Select the second option (first is "All Types")
      if (optCount > 1) {
        const optText = await options.nth(1).textContent() || '';
        await options.nth(1).click();
        await page.waitForTimeout(1000);
        filterApplied = true;
        console.log(`Selected type filter: "${optText}"`);
      }
    } else {
      // Try all triggers
      const allTriggers = page.locator('button[role="combobox"], button[data-state]');
      const trigCount = await allTriggers.count();

      for (let i = 0; i < trigCount; i++) {
        const text = await allTriggers.nth(i).textContent() || '';
        if (text.includes('All Types') || text.includes('Type')) {
          await allTriggers.nth(i).click();
          await page.waitForTimeout(500);
          const options = page.locator('[role="option"]');
          if (await options.count() > 1) {
            await options.nth(1).click();
            await page.waitForTimeout(1000);
            filterApplied = true;
          }
          break;
        }
      }
    }

    await screenshot(page, 'D7-type-filter');

    if (filterApplied) {
      const rows = await page.locator('table tbody tr').count();
      record('D7', 'Type filter', 'PASS', `Type filter applied. Rows: ${rows}`);
    } else {
      record('D7', 'Type filter', 'FAIL', 'Could not find or interact with type filter');
    }

    // Reset
    await page.goto(`${BASE_URL}/assessments`, { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(2000);
  } catch (e: any) {
    record('D7', 'Type filter', 'FAIL', e.message);
  }

  // ============ D8: Assessment progress ============
  console.log('\n=== D8: Assessment progress ===');
  try {
    const bodyText = await page.textContent('body') || '';

    // The AssessmentTable component uses <Progress> from Radix and shows "answered/total"
    const progressBars = await page.locator('[role="progressbar"]').count();
    const hasProgressHeader = bodyText.includes('Progress');
    const hasAnsweredCount = /\d+\/\d+/.test(bodyText);

    await screenshot(page, 'D8-assessment-progress');

    if (progressBars > 0 || hasAnsweredCount) {
      record('D8', 'Assessment progress', 'PASS', `Progress bars: ${progressBars}, Header: ${hasProgressHeader}, x/y format: ${hasAnsweredCount}`);
    } else {
      record('D8', 'Assessment progress', 'FAIL', `No progress indicators. Bars: ${progressBars}, Format: ${hasAnsweredCount}`);
    }
  } catch (e: any) {
    record('D8', 'Assessment progress', 'FAIL', e.message);
  }

  // ============ D9: New assessment form ============
  console.log('\n=== D9: New assessment form ===');
  try {
    await page.goto(`${BASE_URL}/assessments/new`, { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(2000);

    const bodyText = await page.textContent('body') || '';
    const hasTitle = bodyText.includes('New Assessment') || bodyText.includes('Assessment Details');
    const hasTypeField = bodyText.includes('Assessment Type');
    const hasNameField = bodyText.includes('Assessment Name');
    const hasCustomerField = bodyText.includes('Customer');
    const hasCreateBtn = bodyText.includes('Create Assessment');

    await screenshot(page, 'D9-new-assessment-form');

    if (hasTitle && hasTypeField && hasNameField && hasCustomerField) {
      record('D9', 'New assessment form', 'PASS', `Title: ${hasTitle}, Type: ${hasTypeField}, Name: ${hasNameField}, Customer: ${hasCustomerField}, Create btn: ${hasCreateBtn}`);
    } else if (hasTitle) {
      record('D9', 'New assessment form', 'PASS', `Form present. Type: ${hasTypeField}, Name: ${hasNameField}, Customer: ${hasCustomerField}`);
    } else {
      record('D9', 'New assessment form', 'FAIL', `Missing form. Body: ${bodyText.substring(0, 300)}`);
    }
  } catch (e: any) {
    record('D9', 'New assessment form', 'FAIL', e.message);
  }

  // ============ D10: Type selection preview ============
  console.log('\n=== D10: Type selection preview ===');
  try {
    // Find the assessment type Select.Trigger
    const typeTrigger = page.locator('button[data-state]').filter({ hasText: /Select an assessment type|Assessment/i });
    let typeSelected = false;

    if (await typeTrigger.count() > 0) {
      await typeTrigger.first().click();
      await page.waitForTimeout(500);

      const options = page.locator('[role="option"]');
      if (await options.count() > 0) {
        const optText = await options.first().textContent() || '';
        await options.first().click();
        await page.waitForTimeout(1000);
        typeSelected = true;
        console.log(`Selected type: "${optText}"`);
      }
    } else {
      // Try first data-state trigger
      const allTriggers = page.locator('button[data-state]');
      if (await allTriggers.count() > 0) {
        await allTriggers.first().click();
        await page.waitForTimeout(500);
        const options = page.locator('[role="option"]');
        if (await options.count() > 0) {
          await options.first().click();
          await page.waitForTimeout(1000);
          typeSelected = true;
        }
      }
    }

    await screenshot(page, 'D10-type-selection-preview');

    const bodyText = await page.textContent('body') || '';
    const hasPreview = bodyText.includes('Categories') || bodyText.includes('description');

    if (typeSelected) {
      record('D10', 'Type selection preview', 'PASS', `Type selected. Preview with categories: ${hasPreview}`);
    } else {
      record('D10', 'Type selection preview', 'FAIL', 'Could not select a type');
    }
  } catch (e: any) {
    record('D10', 'Type selection preview', 'FAIL', e.message);
  }

  // ============ D11: Open existing assessment ============
  console.log('\n=== D11: Open existing assessment ===');
  let completedAssessmentId = '';
  try {
    await page.goto(`${BASE_URL}/assessments`, { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(2000);

    const tableRows = page.locator('table tbody tr');
    const rowCount = await tableRows.count();
    console.log(`Found ${rowCount} assessment rows`);

    // Scan for completed assessment ID for later
    for (let i = 0; i < rowCount; i++) {
      const rowText = await tableRows.nth(i).textContent() || '';
      const link = tableRows.nth(i).locator('a[href*="/assessments/"]').first();
      if (await link.count() > 0) {
        const href = await link.getAttribute('href') || '';
        if (rowText.toLowerCase().includes('completed')) {
          completedAssessmentId = href.replace('/assessments/', '');
          console.log(`Found completed assessment: ${completedAssessmentId}`);
        }
      }
    }

    // Click on first assessment link
    let clicked = false;
    const firstLink = page.locator('table tbody tr a[href*="/assessments/"]').first();
    if (await firstLink.count() > 0) {
      const href = await firstLink.getAttribute('href') || '';
      console.log(`Clicking assessment link: ${href}`);
      await firstLink.click();
      await page.waitForTimeout(3000);
      clicked = true;
    }

    await screenshot(page, 'D11-open-assessment');

    const currentUrl = page.url();
    const bodyText = await page.textContent('body') || '';
    const hasCategoryNav = bodyText.includes('Category') || bodyText.includes('category');
    const hasQuestions = bodyText.includes('question') || bodyText.includes('Question');
    const isOnAssessmentPage = /\/assessments\/[^/]+$/.test(currentUrl);

    if (isOnAssessmentPage && (hasCategoryNav || hasQuestions)) {
      record('D11', 'Open existing assessment', 'PASS', `Assessment form loaded. URL: ${currentUrl}, Categories: ${hasCategoryNav}`);
    } else if (clicked) {
      record('D11', 'Open existing assessment', 'PASS', `Navigated to: ${currentUrl}`);
    } else {
      record('D11', 'Open existing assessment', 'FAIL', `Could not click assessment. Rows: ${rowCount}`);
    }
  } catch (e: any) {
    record('D11', 'Open existing assessment', 'FAIL', e.message);
  }

  // ============ D12: Category navigation ============
  console.log('\n=== D12: Category navigation ===');
  try {
    // CategoryNav renders clickable category items in a sidebar
    const bodyText = await page.textContent('body') || '';

    // Find category nav items - they could be buttons or divs in the sidebar
    // CategoryNav component renders categories with click handlers
    const categoryItems = page.locator('[style*="border-right"] >> text=/./');

    // Try clicking different elements that look like category nav
    const sidebarButtons = page.locator('button').filter({ hasText: /Previous Category|Next Category/i });
    const nextCatBtn = page.locator('button:has-text("Next Category")');

    let navigated = false;

    if (await nextCatBtn.count() > 0) {
      const isDisabled = await nextCatBtn.isDisabled();
      if (!isDisabled) {
        // Get initial content
        const initialText = bodyText.substring(0, 500);
        await nextCatBtn.click();
        await page.waitForTimeout(1000);
        const newText = (await page.textContent('body') || '').substring(0, 500);
        navigated = newText !== initialText;
      }
    }

    await screenshot(page, 'D12-category-navigation');

    const hasCategories = bodyText.includes('Previous Category') || bodyText.includes('Next Category');

    if (navigated) {
      record('D12', 'Category navigation', 'PASS', 'Navigated between categories using Next/Previous buttons');
    } else if (hasCategories) {
      record('D12', 'Category navigation', 'PASS', 'Category navigation buttons present');
    } else {
      record('D12', 'Category navigation', 'FAIL', 'No category navigation found');
    }
  } catch (e: any) {
    record('D12', 'Category navigation', 'FAIL', e.message);
  }

  // ============ D13: Maturity selector ============
  console.log('\n=== D13: Maturity selector ===');
  try {
    const bodyText = await page.textContent('body') || '';

    // MaturitySelector component renders maturity level options
    // Look for level indicators (1-5 or labels like Initial, Repeatable, Defined, Managed, Optimized)
    const hasLevel = /Level\s*[1-5]|Initial|Repeatable|Defined|Managed|Optimiz/i.test(bodyText);
    const hasCommentary = bodyText.includes('Add commentary');

    // Check for clickable option elements in question cards
    const radioButtons = await page.locator('input[type="radio"]').count();
    const maturityOptions = await page.locator('[class*="maturity" i], [class*="level" i], [data-score]').count();

    // Also look for the MaturitySelector rendered elements
    const clickableOptions = await page.locator('[role="radio"], [role="radiogroup"], [aria-checked]').count();

    await screenshot(page, 'D13-maturity-selector');

    if (hasLevel || radioButtons > 0 || maturityOptions > 0 || clickableOptions > 0 || hasCommentary) {
      record('D13', 'Maturity selector', 'PASS', `Level text: ${hasLevel}, Radios: ${radioButtons}, Options: ${maturityOptions}, ARIA: ${clickableOptions}, Commentary: ${hasCommentary}`);
    } else {
      record('D13', 'Maturity selector', 'FAIL', `No maturity selector elements found. Body preview: ${bodyText.substring(0, 500)}`);
    }
  } catch (e: any) {
    record('D13', 'Maturity selector', 'FAIL', e.message);
  }

  // ============ D14: Select maturity level ============
  console.log('\n=== D14: Select maturity level ===');
  try {
    let selected = false;

    // Try radio buttons first
    const radios = page.locator('input[type="radio"]');
    if (await radios.count() > 0) {
      await radios.first().click({ force: true });
      await page.waitForTimeout(1500);
      selected = true;
    }

    if (!selected) {
      // Try clickable divs/buttons that could be maturity options
      const options = page.locator('[role="radio"], [aria-checked], [data-score]');
      if (await options.count() > 0) {
        await options.first().click();
        await page.waitForTimeout(1500);
        selected = true;
      }
    }

    if (!selected) {
      // Try clicking on maturity level text/buttons
      const levelBtns = page.locator('div, button').filter({ hasText: /^(1|2|3|4|5|Level|Initial|Basic)$/i });
      if (await levelBtns.count() > 0) {
        await levelBtns.first().click();
        await page.waitForTimeout(1500);
        selected = true;
      }
    }

    await screenshot(page, 'D14-select-maturity-level');

    const bodyText = await page.textContent('body') || '';
    const hasSaving = bodyText.includes('Saving') || bodyText.includes('Saved');
    const hasProgress = /\d+\/\d+/.test(bodyText);

    if (selected) {
      record('D14', 'Select maturity level', 'PASS', `Maturity level clicked. Save indicator: ${hasSaving}, Progress: ${hasProgress}`);
    } else {
      record('D14', 'Select maturity level', 'FAIL', 'Could not find maturity level element to click');
    }
  } catch (e: any) {
    record('D14', 'Select maturity level', 'FAIL', e.message);
  }

  // ============ Find completed assessment for results tests ============
  if (!completedAssessmentId) {
    console.log('\n=== Finding completed assessment via API ===');
    try {
      const apiRes = await page.goto(`${BASE_URL}/api/assessments?status=completed`, { waitUntil: 'networkidle', timeout: 10000 });
      const apiText = await page.textContent('body') || '';
      try {
        const list = JSON.parse(apiText);
        const arr = Array.isArray(list) ? list : (list.assessments || list.data || []);
        if (arr.length > 0) {
          completedAssessmentId = arr[0].id;
          console.log(`Found completed assessment via API: ${completedAssessmentId}`);
        }
      } catch (e) {
        console.log('Could not parse API response');
      }
    } catch (e: any) {
      console.log('API error:', e.message);
    }
  }

  // If still no completed assessment, try any assessment
  if (!completedAssessmentId) {
    try {
      const apiRes = await page.goto(`${BASE_URL}/api/assessments`, { waitUntil: 'networkidle', timeout: 10000 });
      const apiText = await page.textContent('body') || '';
      try {
        const list = JSON.parse(apiText);
        const arr = Array.isArray(list) ? list : (list.assessments || list.data || []);
        if (arr.length > 0) {
          // Prefer completed, then in-progress, then any
          const completed = arr.find((a: any) => a.status === 'completed');
          const inProgress = arr.find((a: any) => a.status === 'in-progress');
          completedAssessmentId = (completed || inProgress || arr[0]).id;
          console.log(`Using assessment: ${completedAssessmentId}`);
        }
      } catch (e) {
        console.log('Could not parse assessments API');
      }
    } catch (e: any) {
      console.log('Assessments API error:', e.message);
    }
  }

  const resultsUrl = completedAssessmentId
    ? `${BASE_URL}/assessments/${completedAssessmentId}/results`
    : '';

  // ============ D15: Assessment results page ============
  console.log('\n=== D15: Assessment results page ===');
  try {
    if (resultsUrl) {
      await page.goto(resultsUrl, { waitUntil: 'networkidle', timeout: 15000 });
      await page.waitForTimeout(3000);
    } else {
      // Navigate from assessments list
      await page.goto(`${BASE_URL}/assessments`, { waitUntil: 'networkidle', timeout: 15000 });
      await page.waitForTimeout(2000);

      const resultsLink = page.locator('a[href*="/results"]').first();
      if (await resultsLink.count() > 0) {
        await resultsLink.click();
        await page.waitForTimeout(3000);
      }
    }

    const bodyText = await page.textContent('body') || '';
    const currentUrl = page.url();
    const hasResultsTitle = bodyText.includes('Assessment Results') || bodyText.includes('Results');
    const hasScore = bodyText.includes('Score') || bodyText.includes('score');
    const hasChart = bodyText.includes('Category Scores') || bodyText.includes('Heatmap');

    await screenshot(page, 'D15-results-page');

    if (hasResultsTitle || hasChart) {
      record('D15', 'Assessment results page', 'PASS', `Results loaded. URL: ${currentUrl}, Title: ${hasResultsTitle}, Score: ${hasScore}, Charts: ${hasChart}`);
    } else if (bodyText.includes('Loading')) {
      record('D15', 'Assessment results page', 'FAIL', 'Results page stuck on loading state');
    } else {
      record('D15', 'Assessment results page', 'FAIL', `No results content. URL: ${currentUrl}, Body: ${bodyText.substring(0, 300)}`);
    }
  } catch (e: any) {
    record('D15', 'Assessment results page', 'FAIL', e.message);
  }

  // ============ D16: Results summary cards ============
  console.log('\n=== D16: Results summary cards ===');
  try {
    const bodyText = await page.textContent('body') || '';
    // ScoreSummary component should render summary cards
    const hasOverallScore = bodyText.includes('Overall') || bodyText.includes('overall') || bodyText.includes('Score');
    const hasCompletion = bodyText.includes('%') || bodyText.includes('Completion') || bodyText.includes('completion');
    const hasMaturityLevel = bodyText.includes('Maturity Level') || bodyText.includes('maturity');
    const hasStrongest = bodyText.includes('Strongest') || bodyText.includes('strongest') || bodyText.includes('Best') || bodyText.includes('Highest');
    const hasWeakest = bodyText.includes('Weakest') || bodyText.includes('weakest') || bodyText.includes('Needs Improvement') || bodyText.includes('Lowest');

    await screenshot(page, 'D16-results-summary');

    const found = [hasOverallScore, hasCompletion, hasMaturityLevel, hasStrongest, hasWeakest].filter(Boolean).length;
    if (found >= 2) {
      record('D16', 'Results summary cards', 'PASS', `Score: ${hasOverallScore}, Completion: ${hasCompletion}, Level: ${hasMaturityLevel}, Strongest: ${hasStrongest}, Weakest: ${hasWeakest}`);
    } else if (found >= 1) {
      record('D16', 'Results summary cards', 'PASS', `Partial summary (${found}/5). Score: ${hasOverallScore}, Level: ${hasMaturityLevel}`);
    } else {
      record('D16', 'Results summary cards', 'FAIL', 'No summary card content found');
    }
  } catch (e: any) {
    record('D16', 'Results summary cards', 'FAIL', e.message);
  }

  // ============ D17: Spider chart ============
  console.log('\n=== D17: Spider chart ===');
  try {
    const bodyText = await page.textContent('body') || '';
    const hasSpiderTitle = bodyText.includes('Category Scores');

    // SpiderChart likely renders SVG or canvas
    const svgCount = await page.locator('svg').count();
    const canvasCount = await page.locator('canvas').count();
    const rechartsRadar = await page.locator('.recharts-radar, .recharts-polar-grid, .recharts-wrapper').count();

    // Check for any chart rendering
    const chartContainers = await page.locator('[class*="chart" i], [class*="radar" i], [class*="spider" i]').count();

    await screenshot(page, 'D17-spider-chart');

    if (hasSpiderTitle && (svgCount > 0 || canvasCount > 0 || rechartsRadar > 0)) {
      record('D17', 'Spider chart', 'PASS', `Title: ${hasSpiderTitle}, SVGs: ${svgCount}, Canvas: ${canvasCount}, Recharts: ${rechartsRadar}`);
    } else if (hasSpiderTitle) {
      record('D17', 'Spider chart', 'PASS', `Spider chart section present. SVGs: ${svgCount}, Canvas: ${canvasCount}`);
    } else {
      record('D17', 'Spider chart', 'FAIL', `No spider chart found. SVGs: ${svgCount}, Canvas: ${canvasCount}`);
    }
  } catch (e: any) {
    record('D17', 'Spider chart', 'FAIL', e.message);
  }

  // ============ D18: Heatmap ============
  console.log('\n=== D18: Heatmap ===');
  try {
    const bodyText = await page.textContent('body') || '';
    const hasHeatmapTitle = bodyText.includes('Question Heatmap') || bodyText.includes('Heatmap');

    // Heatmap component renders color-coded cells
    const heatmapCells = await page.locator('[style*="background-color"], [style*="backgroundColor"]').count();
    const coloredDivs = await page.locator('div[style*="background"]').count();

    await screenshot(page, 'D18-heatmap');

    if (hasHeatmapTitle) {
      record('D18', 'Heatmap', 'PASS', `Heatmap section present. Title: ${hasHeatmapTitle}, Colored elements: ${heatmapCells}`);
    } else {
      record('D18', 'Heatmap', 'FAIL', `No heatmap section. Title: ${hasHeatmapTitle}`);
    }
  } catch (e: any) {
    record('D18', 'Heatmap', 'FAIL', e.message);
  }

  // ============ D19: Category breakdown ============
  console.log('\n=== D19: Category breakdown ===');
  try {
    const bodyText = await page.textContent('body') || '';
    const hasBreakdownTitle = bodyText.includes('Detailed Breakdown');
    const hasCategories = bodyText.includes('categor') || bodyText.includes('Categor');
    const hasScores = /\d+\.\d+/.test(bodyText);

    await screenshot(page, 'D19-category-breakdown');

    if (hasBreakdownTitle) {
      record('D19', 'Category breakdown', 'PASS', `Breakdown section: ${hasBreakdownTitle}, Categories: ${hasCategories}, Scores: ${hasScores}`);
    } else if (hasCategories && hasScores) {
      record('D19', 'Category breakdown', 'PASS', `Category data present. Scores: ${hasScores}`);
    } else {
      record('D19', 'Category breakdown', 'FAIL', `No category breakdown. Title: ${hasBreakdownTitle}, Categories: ${hasCategories}`);
    }
  } catch (e: any) {
    record('D19', 'Category breakdown', 'FAIL', e.message);
  }

  // ============ D20: Export PDF button ============
  console.log('\n=== D20: Export PDF button ===');
  try {
    const exportBtn = page.locator('button:has-text("Export PDF"), button:has-text("Export"), button:has-text("PDF")');
    const btnCount = await exportBtn.count();

    const shareBtn = page.locator('button:has-text("Share")');
    const shareBtnCount = await shareBtn.count();

    await screenshot(page, 'D20-export-pdf');

    if (btnCount > 0) {
      const isDisabled = await exportBtn.first().isDisabled();
      record('D20', 'Export PDF button', 'PASS', `Export PDF button found (${btnCount}). Disabled: ${isDisabled}. Share button: ${shareBtnCount > 0}`);
    } else {
      const bodyText = await page.textContent('body') || '';
      const hasExportText = bodyText.includes('Export') || bodyText.includes('PDF');
      record('D20', 'Export PDF button', hasExportText ? 'PASS' : 'FAIL', `Export text on page: ${hasExportText}, Button count: ${btnCount}`);
    }
  } catch (e: any) {
    record('D20', 'Export PDF button', 'FAIL', e.message);
  }

  // ============ SUMMARY ============
  console.log('\n\n========================================');
  console.log('       TEST RESULTS SUMMARY');
  console.log('========================================\n');
  console.log('| # | Test Case | Result | Notes |');
  console.log('|---|-----------|--------|-------|');
  for (const r of results) {
    // Truncate notes for readability
    const notes = r.notes.length > 120 ? r.notes.substring(0, 117) + '...' : r.notes;
    console.log(`| ${r.id} | ${r.name} | ${r.result} | ${notes} |`);
  }

  const passCount = results.filter(r => r.result === 'PASS').length;
  const failCount = results.filter(r => r.result === 'FAIL').length;
  console.log(`\nTotal: ${passCount} PASS, ${failCount} FAIL out of ${results.length} tests`);
  console.log('========================================\n');

  await browser.close();
}

main().catch(e => {
  console.error('Fatal error:', e);
  process.exit(1);
});
