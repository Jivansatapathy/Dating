# Our Memories - Testing Guide

This document provides comprehensive testing instructions for the Our Memories app.

## Quick Start Testing

### 1. Local Testing

```bash
# Serve the app locally
python -m http.server 8000
# or
npx http-server
# or
php -S localhost:8000

# Open in browser
open http://localhost:8000
```

### 2. PWA Testing

1. **Install as PWA**:
   - Chrome: Look for install button in address bar
   - Firefox: Look for install button in address bar
   - Safari: Add to Home Screen

2. **Test offline functionality**:
   - Install the app
   - Disconnect internet
   - App should still work

## Acceptance Tests

### Test 1: Onboarding & Couple Creation

**Steps**:
1. Open the app
2. Fill out onboarding form:
   - Partner A Name: "Alice"
   - Partner B Name: "Bob"
   - Love Date: Today's date
   - Story Start: "We met at a coffee shop..."
   - Device Name: "Alice's Phone"
3. Click "Create Our Memories"

**Expected Results**:
- ✅ Couple created successfully
- ✅ Pairing screen appears with QR code
- ✅ Numeric pairing code displayed
- ✅ Can continue to app

### Test 2: Login by Name

**Steps**:
1. From pairing screen, click "Continue to App"
2. App should open to main interface
3. Close app and reopen
4. Try logging in with:
   - "Alice" (should work)
   - "Bob" (should work)
   - "Charlie" (should fail)

**Expected Results**:
- ✅ "Alice" login succeeds
- ✅ "Bob" login succeeds
- ✅ "Charlie" shows error: "Name not recognized — please enter the exact name your partner set during onboarding."

### Test 3: Chat Functionality

**Steps**:
1. Navigate to Chat tab
2. Send text message: "Hello, my love! 💕"
3. Upload an image
4. Check message appears in chat
5. Switch perspective (click user button)
6. Verify messages show from different perspective

**Expected Results**:
- ✅ Text message sent and displayed
- ✅ Image uploaded and displayed
- ✅ Messages saved to IndexedDB
- ✅ Perspective switching works
- ✅ Confetti animation on send

### Test 4: Memory Book

**Steps**:
1. Navigate to Memory Book tab
2. Click book cover to open
3. Verify first page shows love date and story
4. Click "Add Memory"
5. Fill out memory form:
   - Title: "Our First Date"
   - Date: Yesterday
   - Description: "We went to the park..."
   - Upload 2-3 images
6. Save memory
7. Navigate through pages

**Expected Results**:
- ✅ Book opens with animation
- ✅ First page shows correct content
- ✅ Memory added successfully
- ✅ Images displayed in memory
- ✅ Page navigation works
- ✅ Success toast appears

### Test 5: Timeline View

**Steps**:
1. Navigate to Timeline tab
2. Verify all activities shown
3. Test filters:
   - All (should show everything)
   - Messages (should show only messages)
   - Images (should show only images)
   - Memories (should show only memories)
4. Click on timeline items
5. Verify navigation to relevant sections

**Expected Results**:
- ✅ Timeline shows all activities
- ✅ Filters work correctly
- ✅ Clicking items navigates correctly
- ✅ Items sorted by date (newest first)

### Test 6: Notifications

**Steps**:
1. Go to Settings
2. Enable notifications
3. Grant browser permission
4. Send a message
5. Background the app
6. Send another message (simulate from partner)

**Expected Results**:
- ✅ Notification permission requested
- ✅ Notifications enabled in settings
- ✅ Background notifications work
- ✅ Clicking notification opens app

### Test 7: Export/Import

**Steps**:
1. Go to Settings
2. Click "Export Our Memories"
3. Download ZIP file
4. Clear browser data (or use incognito)
5. Go through onboarding again
6. Go to Settings
7. Click "Import Memories"
8. Upload the ZIP file

**Expected Results**:
- ✅ Export creates ZIP file
- ✅ ZIP contains data.json and images
- ✅ Import restores all data
- ✅ Messages, memories, and images restored

### Test 8: PWA Features

**Steps**:
1. Install app as PWA
2. Test offline functionality
3. Test app icon and splash screen
4. Test full-screen mode
5. Test on mobile device

**Expected Results**:
- ✅ App installs as PWA
- ✅ Works offline
- ✅ Has proper icon and splash screen
- ✅ Full-screen mode works
- ✅ Mobile experience is good

### Test 9: Image Handling

**Steps**:
1. Upload various image formats (JPEG, PNG, GIF, WebP)
2. Upload large images (>5MB)
3. Upload multiple images at once
4. Test image compression
5. Test image lightbox

**Expected Results**:
- ✅ All formats supported
- ✅ Large images compressed
- ✅ Multiple images handled
- ✅ Compression reduces file size
- ✅ Lightbox opens images

### Test 10: Accessibility

**Steps**:
1. Test keyboard navigation (Tab, Enter, Arrow keys)
2. Test screen reader compatibility
3. Test high contrast mode
4. Test with reduced motion preference
5. Test focus indicators

**Expected Results**:
- ✅ Keyboard navigation works
- ✅ Screen reader friendly
- ✅ High contrast mode works
- ✅ Respects motion preferences
- ✅ Clear focus indicators

## Browser Compatibility Testing

### Desktop Browsers
- ✅ Chrome 80+
- ✅ Firefox 75+
- ✅ Safari 13+
- ✅ Edge 80+

### Mobile Browsers
- ✅ Chrome Mobile
- ✅ Safari Mobile
- ✅ Firefox Mobile
- ✅ Samsung Internet

## Performance Testing

### Metrics to Check
- **First Load**: < 3 seconds
- **Navigation**: < 500ms
- **Image Upload**: < 5 seconds for 5MB image
- **Memory Usage**: < 100MB for typical usage
- **Storage**: Efficient IndexedDB usage

### Tools
- Chrome DevTools Performance tab
- Lighthouse audit
- Network tab for loading times

## Error Handling Testing

### Test Error Scenarios
1. **Network offline**: App should work offline
2. **Storage quota exceeded**: Should show appropriate error
3. **Invalid image format**: Should show error message
4. **Corrupted data**: Should handle gracefully
5. **Browser compatibility**: Should show fallback

## Security Testing

### Privacy Verification
- ✅ No data sent to external servers (without optional server)
- ✅ All data stored locally in IndexedDB
- ✅ No tracking or analytics
- ✅ Name-only login is clearly documented

## Automated Testing (Future)

### Unit Tests
```bash
# Future implementation
npm test
```

### E2E Tests
```bash
# Future implementation with Playwright
npm run test:e2e
```

## Manual Testing Checklist

### Pre-Release Checklist
- [ ] All acceptance tests pass
- [ ] Works on major browsers
- [ ] PWA installation works
- [ ] Offline functionality works
- [ ] Export/import works
- [ ] Notifications work
- [ ] Accessibility features work
- [ ] Performance is acceptable
- [ ] No console errors
- [ ] Mobile experience is good

### Post-Release Monitoring
- [ ] Monitor user feedback
- [ ] Check error logs
- [ ] Monitor performance metrics
- [ ] Test on real devices

## Troubleshooting Common Issues

### Issue: App won't load
**Solution**: Check browser console for errors, ensure serving via HTTP

### Issue: Images not uploading
**Solution**: Check browser storage quota, try smaller images

### Issue: Notifications not working
**Solution**: Check browser permissions, ensure HTTPS in production

### Issue: Export/import fails
**Solution**: Check file size limits, ensure ZIP format is correct

### Issue: PWA not installing
**Solution**: Check manifest file, ensure HTTPS, check browser support

## Test Data

### Sample Couple Data
```json
{
  "partnerAName": "Alice",
  "partnerBName": "Bob",
  "loveDate": "2024-01-01",
  "storyStart": "We met at a coffee shop on a rainy day..."
}
```

### Sample Messages
- "Hello, my love! 💕"
- "I miss you already"
- "Look at this beautiful sunset! [image]"
- "Can't wait to see you tonight"

### Sample Memories
- "Our First Date" - Park picnic
- "Anniversary Dinner" - Restaurant
- "Weekend Getaway" - Beach trip

## Reporting Issues

When reporting issues, include:
1. Browser and version
2. Device type (desktop/mobile)
3. Steps to reproduce
4. Expected vs actual behavior
5. Console errors (if any)
6. Screenshots (if helpful)

## Continuous Testing

### Daily Checks
- [ ] App loads correctly
- [ ] Basic functionality works
- [ ] No console errors

### Weekly Checks
- [ ] Full acceptance test suite
- [ ] Performance metrics
- [ ] Browser compatibility

### Monthly Checks
- [ ] Security audit
- [ ] Accessibility review
- [ ] User feedback analysis
