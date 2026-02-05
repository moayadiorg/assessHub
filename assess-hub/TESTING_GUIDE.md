# Testing Guide: Admin Assessment Types UI

## Quick Start

1. Start the development server:
```bash
cd /Users/moayad/Documents/projects/IaCWorkshop/assess-hub
npm run dev
```

2. Open your browser to http://localhost:3005

## Test Scenarios

### Scenario 1: Admin Dashboard Navigation
**URL**: http://localhost:3005/admin

**Expected Results**:
- Page loads with "Admin Dashboard" header
- Three cards displayed in a responsive grid:
  - Assessment Types (with FileText icon)
  - Questions Editor (with ListBullet icon)
  - CSV Import (with Upload icon)
- Cards have hover effect
- Clicking "Assessment Types" navigates to `/admin/types`

---

### Scenario 2: View Assessment Types List (Empty State)
**URL**: http://localhost:3005/admin/types

**Prerequisites**: No assessment types in database

**Expected Results**:
- Page loads with "Assessment Types" header
- Shows "0 Assessment Types" count
- Empty state card displays:
  - "No assessment types yet" message
  - "Create Your First Type" button
- Clicking button navigates to `/admin/types/new`

---

### Scenario 3: Create New Assessment Type
**URL**: http://localhost:3005/admin/types/new

**Test Steps**:
1. Fill in the form:
   - Name: "Cloud Maturity Assessment"
   - Description: "Evaluate cloud infrastructure readiness"
   - Version: "1.0"
   - Color: Select "Blue"
2. Click "Create" button

**Expected Results**:
- Form validates (name is required)
- Submit shows "Saving..." state
- On success, redirects to `/admin/types`
- New type appears in the list

**Edge Cases to Test**:
- Try submitting with empty name (should prevent submission)
- Test Cancel button (should go back)
- Test all color options (should show colored dots)

---

### Scenario 4: View Assessment Types List (With Data)
**URL**: http://localhost:3005/admin/types

**Prerequisites**: At least one assessment type exists

**Expected Results**:
- Shows correct count (e.g., "1 Assessment Type" or "2 Assessment Types")
- Grid displays type cards (1 col mobile, 2 tablet, 3 desktop)
- Each card shows:
  - Colored dot matching iconColor
  - Name as bold heading
  - Description text (if provided)
  - Version badge (e.g., "v1.0")
  - Category and assessment counts
  - Three-dot menu button

---

### Scenario 5: Edit Assessment Type
**URL**: Click Edit from dropdown menu

**Test Steps**:
1. On `/admin/types`, click the three-dot menu on a card
2. Click "Edit"
3. Modify the data:
   - Change name to "Cloud Maturity Assessment v2"
   - Update version to "2.0"
   - Change color to "Green"
4. Click "Update"

**Expected Results**:
- Form loads with existing data pre-populated
- All fields are editable
- Submit shows "Saving..." state
- On success, redirects to `/admin/types`
- Card reflects updated data
- Color dot changes to new color

---

### Scenario 6: Delete Assessment Type (No Assessments)
**URL**: http://localhost:3005/admin/types

**Test Steps**:
1. Click the three-dot menu on a type with 0 assessments
2. Click "Delete"
3. Confirmation dialog appears
4. Click "Delete" to confirm

**Expected Results**:
- AlertDialog opens with warning message
- "Cancel" button closes dialog without deleting
- "Delete" button removes the type
- Type is removed from database (hard delete)
- List refreshes and no longer shows the type
- Count updates

---

### Scenario 7: Delete Assessment Type (With Assessments)
**URL**: http://localhost:3005/admin/types

**Prerequisites**: Assessment type has assessments

**Test Steps**:
1. Click the three-dot menu on a type with assessments
2. Click "Delete"
3. Click "Delete" to confirm

**Expected Results**:
- Type is soft deleted (isActive set to false)
- "Inactive" red badge appears on the card
- Type remains in list but marked inactive
- Assessments are preserved

---

### Scenario 8: Responsive Design Testing

**Test on different screen sizes**:

**Mobile (< 640px)**:
- Cards stack in single column
- Form fields are full width
- All text is readable
- Buttons are touch-friendly

**Tablet (640px - 1024px)**:
- Types list shows 2 columns
- Admin dashboard shows 2 columns
- Form remains centered

**Desktop (> 1024px)**:
- Types list shows 3 columns
- Admin dashboard shows 3 columns
- Form is max 600px wide

---

### Scenario 9: Color Picker Functionality
**URL**: http://localhost:3005/admin/types/new

**Test Steps**:
1. Open the Color dropdown
2. Hover over each option

**Expected Results**:
- Dropdown shows 8 color options
- Each option has:
  - Colored dot preview (12px circle)
  - Color name label
- Selecting a color updates the form state
- Color persists on form submission

---

### Scenario 10: Form Validation
**URL**: http://localhost:3005/admin/types/new

**Test Cases**:

1. **Empty Name**:
   - Leave name blank
   - Try to submit
   - Expected: HTML5 validation prevents submission

2. **Empty Description**:
   - Fill name only
   - Submit form
   - Expected: Succeeds (description is optional)

3. **Default Version**:
   - Create without changing version
   - Expected: Defaults to "1.0"

4. **Default Color**:
   - Create without changing color
   - Expected: Defaults to Blue (#3b82f6)

---

## API Testing

You can also test the APIs directly using curl or tools like Postman:

### Get All Types
```bash
curl http://localhost:3005/api/assessment-types
```

### Create Type
```bash
curl -X POST http://localhost:3005/api/assessment-types \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Security Assessment",
    "description": "Evaluate security posture",
    "version": "1.0",
    "iconColor": "#ef4444"
  }'
```

### Update Type
```bash
curl -X PUT http://localhost:3005/api/assessment-types/{id} \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Security Assessment Updated",
    "version": "2.0"
  }'
```

### Delete Type
```bash
curl -X DELETE http://localhost:3005/api/assessment-types/{id}
```

---

## Common Issues & Solutions

### Issue: "No assessment types yet" but data exists
**Solution**: Check if browser cache is stale. Hard refresh (Cmd+Shift+R on Mac)

### Issue: Form doesn't submit
**Solution**: Check browser console for errors. Ensure API is running on port 3005

### Issue: Color doesn't update
**Solution**: Verify the selected color value is being sent in the API request

### Issue: Delete confirmation doesn't appear
**Solution**: Check if AlertDialog is rendering. Look for React errors in console

### Issue: 404 on edit page
**Solution**: Verify the assessment type ID exists in the database

---

## Database Verification

You can verify the data using Prisma Studio:

```bash
npx prisma studio
```

This opens a GUI at http://localhost:5555 where you can:
- View all assessment types
- Check isActive status
- Verify iconColor values
- See relationships with categories and assessments

---

## Browser DevTools Checklist

While testing, check for:
- [ ] No console errors
- [ ] No 404 errors in Network tab
- [ ] API calls return 200/201 status codes
- [ ] Components render without warnings
- [ ] No React hydration errors
- [ ] Smooth transitions between pages

---

## Accessibility Testing

- [ ] All buttons are keyboard accessible (Tab navigation)
- [ ] Form can be submitted with Enter key
- [ ] Focus indicators are visible
- [ ] Dropdown menus work with keyboard (Arrow keys)
- [ ] Dialog can be closed with Escape key
- [ ] Text is readable with proper contrast

---

## Success Criteria

All features are working correctly when:
- ✅ Admin dashboard displays and navigates properly
- ✅ Types list shows all types with correct data
- ✅ Create form validates and submits successfully
- ✅ Edit form loads and updates data correctly
- ✅ Delete confirmation works with soft/hard delete logic
- ✅ Color picker displays all options with visual indicators
- ✅ Responsive layout works on all screen sizes
- ✅ No console errors or warnings
- ✅ All API endpoints respond correctly
- ✅ UI matches Radix UI Themes design system
