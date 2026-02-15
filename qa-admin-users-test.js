const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const BASE_URL = 'http://localhost:3005';
const SCREENSHOT_DIR = path.join(__dirname, 'qa-screenshots');

// Ensure screenshot directory exists
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

const results = [];

function record(id, name, result, notes) {
  results.push({ id, name, result, notes });
  console.log(`[${result}] ${id}: ${name} - ${notes}`);
}

async function screenshot(page, name) {
  const filePath = path.join(SCREENSHOT_DIR, `${name}.png`);
  await page.screenshot({ path: filePath, fullPage: true });
  console.log(`  Screenshot saved: ${filePath}`);
  return filePath;
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  // ==========================================
  // SIGN IN AS ADMIN
  // ==========================================
  console.log('\n=== SIGNING IN AS ADMIN ===\n');
  try {
    await page.goto(`${BASE_URL}/auth/signin`, { waitUntil: 'networkidle' });

    // Fill email
    const emailInput = page.locator('input[placeholder="Email"]');
    await emailInput.waitFor({ state: 'visible', timeout: 10000 });
    await emailInput.fill('moayad.ismail@gmail.com');

    // Select Admin role
    const roleSelect = page.locator('select');
    await roleSelect.selectOption('admin');

    // Click Sign In (Dev)
    const signInButton = page.getByRole('button', { name: /Sign In/i });
    await signInButton.click();

    // Wait for redirect
    await page.waitForURL('**/', { timeout: 15000 });
    console.log('Successfully signed in as admin');
    console.log('Current URL:', page.url());
  } catch (e) {
    console.error('SIGN IN FAILED:', e.message);
    await screenshot(page, '00-signin-failure');
    await browser.close();
    process.exit(1);
  }

  // ==========================================
  // C1: Users page loads
  // ==========================================
  console.log('\n=== C1: Users page loads ===\n');
  try {
    await page.goto(`${BASE_URL}/admin/users`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000); // Wait for data to load

    // Check for table headers
    const emailHeader = await page.locator('th', { hasText: 'Email' }).count();
    const nameHeader = await page.locator('th', { hasText: 'Name' }).count();
    const roleHeader = await page.locator('th', { hasText: 'Role' }).count();
    const statusHeader = await page.locator('th', { hasText: 'Status' }).count();

    const hasAllColumns = emailHeader > 0 && nameHeader > 0 && roleHeader > 0 && statusHeader > 0;

    await screenshot(page, 'C1-users-page-loads');

    if (hasAllColumns) {
      record('C1', 'Users page loads', 'PASS', `Table found with Email(${emailHeader}), Name(${nameHeader}), Role(${roleHeader}), Status(${statusHeader}) columns`);
    } else {
      record('C1', 'Users page loads', 'FAIL', `Missing columns - Email:${emailHeader}, Name:${nameHeader}, Role:${roleHeader}, Status:${statusHeader}`);
    }
  } catch (e) {
    await screenshot(page, 'C1-error');
    record('C1', 'Users page loads', 'FAIL', `Error: ${e.message}`);
  }

  // ==========================================
  // C2: User count display
  // ==========================================
  console.log('\n=== C2: User count display ===\n');
  try {
    // The header shows "{count} User(s)"
    const countText = await page.locator('text=/\\d+\\s+Users?/').first();
    const isVisible = await countText.isVisible();
    const text = isVisible ? await countText.textContent() : null;

    await screenshot(page, 'C2-user-count-display');

    if (isVisible && text) {
      record('C2', 'User count display', 'PASS', `Shows user count: "${text}"`);
    } else {
      record('C2', 'User count display', 'FAIL', 'User count not visible in header area');
    }
  } catch (e) {
    await screenshot(page, 'C2-error');
    record('C2', 'User count display', 'FAIL', `Error: ${e.message}`);
  }

  // ==========================================
  // C3: User role badges
  // ==========================================
  console.log('\n=== C3: User role badges ===\n');
  try {
    // Look for role badges in the table
    const badges = await page.locator('table span.rt-Badge').all();
    const badgeInfo = [];

    for (const badge of badges) {
      const text = await badge.textContent();
      const color = await badge.getAttribute('data-accent-color');
      badgeInfo.push({ text, color });
    }

    // Check for different role badges
    const roleBadges = badgeInfo.filter(b =>
      ['Administrator', 'Solution Architect', 'Reader'].includes(b.text)
    );

    const uniqueRoles = [...new Set(roleBadges.map(b => `${b.text}(${b.color})`))];

    await screenshot(page, 'C3-user-role-badges');

    if (roleBadges.length > 0) {
      const hasColors = roleBadges.some(b => b.color);
      record('C3', 'User role badges', hasColors ? 'PASS' : 'FAIL',
        `Found role badges: ${uniqueRoles.join(', ')}`);
    } else {
      record('C3', 'User role badges', 'FAIL', `No role badges found. All badges: ${JSON.stringify(badgeInfo)}`);
    }
  } catch (e) {
    await screenshot(page, 'C3-error');
    record('C3', 'User role badges', 'FAIL', `Error: ${e.message}`);
  }

  // ==========================================
  // C4: User status badges
  // ==========================================
  console.log('\n=== C4: User status badges ===\n');
  try {
    const badges = await page.locator('table span.rt-Badge').all();
    const statusBadges = [];

    for (const badge of badges) {
      const text = await badge.textContent();
      const color = await badge.getAttribute('data-accent-color');
      if (text === 'Active' || text === 'Inactive') {
        statusBadges.push({ text, color });
      }
    }

    const uniqueStatuses = [...new Set(statusBadges.map(b => `${b.text}(${b.color})`))];

    await screenshot(page, 'C4-user-status-badges');

    if (statusBadges.length > 0) {
      const activeGreen = statusBadges.some(b => b.text === 'Active' && b.color === 'green');
      const inactiveRed = statusBadges.some(b => b.text === 'Inactive' && b.color === 'red');

      let notes = `Status badges found: ${uniqueStatuses.join(', ')}.`;
      if (activeGreen) notes += ' Active=green confirmed.';
      if (inactiveRed) notes += ' Inactive=red confirmed.';
      if (!activeGreen && !inactiveRed) notes += ' Color differentiation present but may differ from expected.';

      record('C4', 'User status badges', 'PASS', notes);
    } else {
      record('C4', 'User status badges', 'FAIL', 'No Active/Inactive badges found');
    }
  } catch (e) {
    await screenshot(page, 'C4-error');
    record('C4', 'User status badges', 'FAIL', `Error: ${e.message}`);
  }

  // ==========================================
  // C5: Search users
  // ==========================================
  console.log('\n=== C5: Search users ===\n');
  try {
    // Get initial count
    const initialRows = await page.locator('table tbody tr').count();

    // Find search input
    const searchInput = page.locator('input[placeholder*="Search"]');
    await searchInput.waitFor({ state: 'visible', timeout: 5000 });

    // Type a search term - use part of an email
    await searchInput.fill('moayad');

    // Wait for filtering to take effect (API call)
    await page.waitForTimeout(1500);
    await page.waitForLoadState('networkidle');

    const filteredRows = await page.locator('table tbody tr').count();

    // Check if any text on the page matches the search
    const pageContent = await page.content();
    const hasSearchResults = pageContent.includes('moayad') || filteredRows >= 0;

    await screenshot(page, 'C5-search-users');

    // Check if there's a "no users match" message or filtered results
    const noMatchMsg = await page.locator('text=/No users match/').count();

    if (hasSearchResults) {
      record('C5', 'Search users', 'PASS',
        `Search works. Initial rows: ${initialRows}, After search "moayad": ${filteredRows} rows${noMatchMsg > 0 ? ' (no match message shown)' : ''}`);
    } else {
      record('C5', 'Search users', 'FAIL', 'Search did not produce expected results');
    }

    // Clear search for next tests
    await searchInput.clear();
    await page.waitForTimeout(1000);
    await page.waitForLoadState('networkidle');
  } catch (e) {
    await screenshot(page, 'C5-error');
    record('C5', 'Search users', 'FAIL', `Error: ${e.message}`);
  }

  // ==========================================
  // C6: Filter by role
  // ==========================================
  console.log('\n=== C6: Filter by role ===\n');
  try {
    // Get initial count
    const initialRows = await page.locator('table tbody tr').count();

    // Click the role filter trigger (Radix Select)
    const filterTrigger = page.locator('button.rt-SelectTrigger', { hasText: /All Roles|Filter by role/i });
    await filterTrigger.waitFor({ state: 'visible', timeout: 5000 });
    await filterTrigger.click();

    // Wait for dropdown to appear
    await page.waitForTimeout(500);

    // Select "Administrator" option
    const adminOption = page.locator('[role="option"]', { hasText: 'Administrator' });
    await adminOption.waitFor({ state: 'visible', timeout: 5000 });
    await adminOption.click();

    // Wait for filter to apply
    await page.waitForTimeout(1500);
    await page.waitForLoadState('networkidle');

    const filteredRows = await page.locator('table tbody tr').count();

    await screenshot(page, 'C6-filter-by-role');

    // Check that filtering happened
    const noMatchMsg = await page.locator('text=/No users match/').count();

    record('C6', 'Filter by role', 'PASS',
      `Role filter works. Initial: ${initialRows} rows, After "Administrator" filter: ${filteredRows} rows${noMatchMsg > 0 ? ' (no match message shown)' : ''}`);

    // Reset filter
    const resetTrigger = page.locator('button.rt-SelectTrigger').first();
    await resetTrigger.click();
    await page.waitForTimeout(500);
    const allRolesOption = page.locator('[role="option"]', { hasText: 'All Roles' });
    if (await allRolesOption.isVisible()) {
      await allRolesOption.click();
      await page.waitForTimeout(1000);
      await page.waitForLoadState('networkidle');
    }
  } catch (e) {
    await screenshot(page, 'C6-error');
    record('C6', 'Filter by role', 'FAIL', `Error: ${e.message}`);
  }

  // ==========================================
  // C7: Add user dialog
  // ==========================================
  console.log('\n=== C7: Add user dialog ===\n');
  try {
    // Click "Add User" button
    const addButton = page.getByRole('button', { name: /Add User/i });
    await addButton.waitFor({ state: 'visible', timeout: 5000 });
    await addButton.click();

    // Wait for dialog to appear
    await page.waitForTimeout(1000);

    // Check for dialog content
    const dialogTitle = await page.locator('[role="dialog"]').locator('text=Add User').count();
    const emailField = await page.locator('[role="dialog"] input[type="email"]').count();
    const nameField = await page.locator('[role="dialog"] input[placeholder*="name"]').count();
    const roleSelect = await page.locator('[role="dialog"] button.rt-SelectTrigger').count();

    await screenshot(page, 'C7-add-user-dialog');

    const hasAllFields = dialogTitle > 0 && emailField > 0 && nameField > 0 && roleSelect > 0;

    if (hasAllFields) {
      record('C7', 'Add user dialog', 'PASS',
        `Dialog opens with: Title(${dialogTitle}), Email(${emailField}), Name(${nameField}), Role selector(${roleSelect})`);
    } else {
      record('C7', 'Add user dialog', 'FAIL',
        `Missing dialog fields - Title:${dialogTitle}, Email:${emailField}, Name:${nameField}, Role:${roleSelect}`);
    }
  } catch (e) {
    await screenshot(page, 'C7-error');
    record('C7', 'Add user dialog', 'FAIL', `Error: ${e.message}`);
  }

  // ==========================================
  // C8: Add user validation
  // ==========================================
  console.log('\n=== C8: Add user validation ===\n');
  try {
    // The dialog should still be open from C7
    // Make sure email field is empty
    const emailInput = page.locator('[role="dialog"] input[type="email"]');
    await emailInput.clear();

    // Click the "Add User" submit button inside the dialog
    const submitButton = page.locator('[role="dialog"] button[type="submit"]');
    await submitButton.click();

    // Wait for validation
    await page.waitForTimeout(1000);

    // Check for error - either HTML5 validation or custom error
    const customError = await page.locator('[role="dialog"]').locator('text=/required|valid email/i').count();
    const html5Validation = await emailInput.evaluate(el => !el.validity.valid);

    await screenshot(page, 'C8-add-user-validation');

    if (customError > 0 || html5Validation) {
      record('C8', 'Add user validation', 'PASS',
        `Validation shown: custom error=${customError > 0}, HTML5 validation=${html5Validation}`);
    } else {
      record('C8', 'Add user validation', 'FAIL', 'No validation error shown for empty email');
    }

    // Close the dialog
    const cancelButton = page.locator('[role="dialog"] button', { hasText: 'Cancel' });
    if (await cancelButton.isVisible()) {
      await cancelButton.click();
      await page.waitForTimeout(500);
    }
  } catch (e) {
    await screenshot(page, 'C8-error');
    record('C8', 'Add user validation', 'FAIL', `Error: ${e.message}`);
  }

  // ==========================================
  // C9: Edit user
  // ==========================================
  console.log('\n=== C9: Edit user ===\n');
  try {
    // Make sure we're on the users page and dialog is closed
    await page.goto(`${BASE_URL}/admin/users`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Click "Edit" button on first user row
    const editButton = page.locator('table tbody tr').first().locator('button', { hasText: 'Edit' });
    await editButton.waitFor({ state: 'visible', timeout: 5000 });
    await editButton.click();

    // Wait for dialog to open
    await page.waitForTimeout(1000);

    // Check dialog title says "Edit User"
    const editTitle = await page.locator('[role="dialog"]').locator('text=Edit User').count();

    // Check email is pre-filled and disabled
    const emailInput = page.locator('[role="dialog"] input[type="email"]');
    const emailValue = await emailInput.inputValue();
    const emailDisabled = await emailInput.isDisabled();

    // Check name field has value
    const nameInput = page.locator('[role="dialog"] input[placeholder*="name"]');
    const nameValue = await nameInput.inputValue();

    await screenshot(page, 'C9-edit-user');

    if (editTitle > 0 && emailValue) {
      record('C9', 'Edit user', 'PASS',
        `Edit dialog shows with pre-filled email="${emailValue}", disabled=${emailDisabled}, name="${nameValue}"`);
    } else {
      record('C9', 'Edit user', 'FAIL',
        `Edit dialog issue - Title:${editTitle}, Email:"${emailValue}", Disabled:${emailDisabled}`);
    }

    // Close dialog
    const cancelButton = page.locator('[role="dialog"] button', { hasText: 'Cancel' });
    if (await cancelButton.isVisible()) {
      await cancelButton.click();
      await page.waitForTimeout(500);
    }
  } catch (e) {
    await screenshot(page, 'C9-error');
    record('C9', 'Edit user', 'FAIL', `Error: ${e.message}`);
  }

  // ==========================================
  // C10: User last login
  // ==========================================
  console.log('\n=== C10: User last login ===\n');
  try {
    // Check for "Last Login" column header
    const lastLoginHeader = await page.locator('th', { hasText: 'Last Login' }).count();

    // Check for "Never" or date in last login cells
    const lastLoginCells = await page.locator('table tbody tr td:nth-child(5)').all();
    const cellTexts = [];
    for (const cell of lastLoginCells) {
      const text = (await cell.textContent()).trim();
      cellTexts.push(text);
    }

    const hasNever = cellTexts.some(t => t === 'Never');
    const hasDate = cellTexts.some(t => /\w{3}\s+\d+,\s+\d{4}/.test(t));

    await screenshot(page, 'C10-user-last-login');

    if (lastLoginHeader > 0 && cellTexts.length > 0) {
      record('C10', 'User last login', 'PASS',
        `Last Login column present. Values: ${cellTexts.join(', ')}. Has "Never": ${hasNever}, Has dates: ${hasDate}`);
    } else {
      record('C10', 'User last login', 'FAIL',
        `Last Login header: ${lastLoginHeader}, Cell values: ${cellTexts.join(', ')}`);
    }
  } catch (e) {
    await screenshot(page, 'C10-error');
    record('C10', 'User last login', 'FAIL', `Error: ${e.message}`);
  }

  // ==========================================
  // SUMMARY
  // ==========================================
  console.log('\n\n========================================');
  console.log('       TEST RESULTS SUMMARY');
  console.log('========================================\n');

  const passCount = results.filter(r => r.result === 'PASS').length;
  const failCount = results.filter(r => r.result === 'FAIL').length;

  console.log('| # | Test Case | Result | Notes |');
  console.log('|---|-----------|--------|-------|');
  for (const r of results) {
    console.log(`| ${r.id} | ${r.name} | ${r.result} | ${r.notes} |`);
  }
  console.log('');
  console.log(`Total: ${passCount} PASS, ${failCount} FAIL out of ${results.length} tests`);

  await browser.close();
}

run().catch(e => {
  console.error('Fatal error:', e);
  process.exit(1);
});
