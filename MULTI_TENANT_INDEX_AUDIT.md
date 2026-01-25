/**
 * AUDIT REPORT: Multi-Tenant Index Issues
 * ========================================
 * 
 * This document identifies models with missing userId in indexes,
 * which can cause data conflicts in a multi-tenant system.
 */

## CRITICAL ISSUES FOUND:

### 1. ❌ Animal Model (animal.model.ts)
**Problem:** Unique index on (serialNumber, animalType) WITHOUT userId
```typescript
animalSchema.index({ serialNumber: 1, animalType: 1 }, { unique: true });
```
**Impact:** User A and User B cannot both have a cow with serial number "C001"
**Fix Required:** Add userId to unique index
```typescript
animalSchema.index({ userId: 1, serialNumber: 1, animalType: 1 }, { unique: true });
```

**Also Missing userId in query indexes:**
```typescript
animalSchema.index({ animalType: 1 });
animalSchema.index({ isSold: 1 });
animalSchema.index({ isActive: 1 });
```
**Should be:**
```typescript
animalSchema.index({ userId: 1, animalType: 1 });
animalSchema.index({ userId: 1, isSold: 1 });
animalSchema.index({ userId: 1, isActive: 1 });
```

---

### 2. ❌ Insemination Model (insemination.model.ts)
**Problem:** All indexes missing userId
```typescript
inseminationSchema.index({ animal: 1 });
inseminationSchema.index({ inseminationDate: -1 });
inseminationSchema.index({ pregnancyCheckDate: 1 });
inseminationSchema.index({ pregnancyStatus: 1 });
inseminationSchema.index({ notificationSent: 1, pregnancyStatus: 1 });
```
**Impact:** Queries will scan all users' data, poor performance
**Fix Required:** Add userId to ALL indexes
```typescript
inseminationSchema.index({ userId: 1, animal: 1 });
inseminationSchema.index({ userId: 1, inseminationDate: -1 });
inseminationSchema.index({ userId: 1, pregnancyCheckDate: 1 });
inseminationSchema.index({ userId: 1, pregnancyStatus: 1 });
inseminationSchema.index({ userId: 1, notificationSent: 1, pregnancyStatus: 1 });
```

---

### 3. ❌ Expense Model (expense.model.ts)
**Problem:** All indexes missing userId
```typescript
expenseSchema.index({ date: -1 });
expenseSchema.index({ category: 1 });
expenseSchema.index({ date: -1, category: 1 });
```
**Impact:** Queries will scan all users' data, poor performance
**Fix Required:** Add userId to ALL indexes
```typescript
expenseSchema.index({ userId: 1, date: -1 });
expenseSchema.index({ userId: 1, category: 1 });
expenseSchema.index({ userId: 1, date: -1, category: 1 });
```

---

### 4. ✅ Milk Rate Model (milk-rate.model.ts)
**Status:** FIXED ✓
```typescript
milkRateSchema.index({ userId: 1, animalType: 1, effectiveFrom: 1 }, { unique: true });
milkRateSchema.index({ userId: 1, animalType: 1, effectiveFrom: -1 });
```

---

### 5. ✅ Milk Collection Model (milk-collection.model.ts)
**Status:** FIXED ✓
```typescript
milkCollectionSchema.index({ userId: 1, date: 1, session: 1, animalType: 1 }, { unique: true });
milkCollectionSchema.index({ userId: 1, date: -1 });
milkCollectionSchema.index({ userId: 1, animalType: 1, date: -1 });
```

---

### 6. ✅ Notification Model (notification.model.ts)
**Status:** CORRECT ✓
All indexes properly include userId

---

### 7. ✅ Pregnancy Status Model (pregnancy-status.model.ts)
**Status:** CORRECT ✓
All indexes properly include userId

---

### 8. ℹ️ User Model (user.model.ts)
**Status:** Not applicable (global users, not multi-tenant)

---

### 9. ℹ️ OTP Model (otp.model.ts)
**Status:** Not applicable (global OTPs by email)

---

## SUMMARY:
- ✅ Fixed: 2 models (milk-rate, milk-collection)
- ❌ Need Fix: 3 models (animal, insemination, expense)
- ✓ Correct: 2 models (notification, pregnancy-status)
- N/A: 2 models (user, otp)

## PRIORITY:
1. **HIGH:** Animal model (unique index conflict)
2. **MEDIUM:** Insemination & Expense models (performance issues)

## NEXT STEPS:
Run fix-all-indexes.ts script to correct all issues
