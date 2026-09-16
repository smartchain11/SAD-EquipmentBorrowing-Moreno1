# Requirements Traceability Matrix

| Requirement ID | Functional Requirement | Implemented Feature        | Test Case | Test Result |
| -------------- | ---------------------- | -------------------------- | --------- | ----------- |
| FR-01          | User Login             | Login / Sign-up page       | TC-01     | PASS        |
| FR-02          | Add Equipment          | Equipment form + insert    | TC-02     | PASS        |
| FR-03          | Edit Equipment         | Edit equipment modal       | TC-03     | PASS        |
| FR-04          | Delete Equipment       | Delete with confirmation   | TC-04     | PASS        |
| FR-05          | Record Borrowing       | New borrowing transaction  | TC-05     | PASS        |
| FR-06          | Approve / Reject       | Officer approval workflow  | TC-06     | PASS        |
| FR-07          | Claim Equipment        | Approved → Borrowed        | TC-07     | PASS        |
| FR-08          | Return Equipment       | Return button + function   | TC-08     | PASS        |
| FR-09          | Detect Overdue         | Overdue status (BR-09)     | TC-09     | PASS        |
| FR-10          | Cancel Own Request     | Borrower cancels pending   | TC-10     | PASS        |
| FR-11          | Search Records         | Search bar (name/code/borrower) | TC-11 | PASS       |
| FR-12          | Filter Records         | Status / availability filters | TC-12   | PASS        |
| FR-13          | Dashboard Summary      | Dashboard statistics       | TC-13     | PASS        |
| FR-14          | Audit Logs             | Admin-only audit log view  | TC-14     | PASS        |
| FR-15          | Role-Based Access      | 3-role permission system   | TC-15     | PASS        |

---

## Lab 4 Functional Test Results (Section B)

| Test ID   | Test Scenario                                  | Expected Result                                                    | Actual Result                              | Status |
| --------- | ---------------------------------------------- | ------------------------------------------------------------------ | ------------------------------------------ | ------ |
| TC-B4-01  | Borrower submits borrow request                | Saved as Pending                                                   | Transaction saved with Pending status      | PASS   |
| TC-B4-02  | Borrow unavailable equipment                   | Blocked by BR-03                                                   | Error: "Only available equipment may be borrowed" | PASS |
| TC-B4-03  | Officer approves pending request               | Status → Approved                                                  | Status changed to Approved                 | PASS   |
| TC-B4-04  | Officer rejects pending request                | Status → Rejected                                                  | Status changed to Rejected                 | PASS   |
| TC-B4-05  | Officer claims approved equipment              | Status → Borrowed, equipment availability → Borrowed               | Equipment marked as Borrowed               | PASS   |
| TC-B4-06  | Officer returns borrowed equipment             | Status → Returned, equipment availability → Available              | Equipment returned successfully            | PASS   |
| TC-B4-07  | Borrower cancels another user's request        | Blocked                                                            | Error: "You can only cancel your own requests" | PASS |
| TC-B4-08  | Borrow equipment that is already Borrowed      | Blocked by BR-03                                                   | Error: "Only available equipment may be borrowed" | PASS |
| TC-B4-09  | Check audit log after approval                 | Approval log visible in Audit Logs page                            | APPROVE action logged with details         | PASS   |
| TC-B4-10  | Open protected page without login              | Access denied / redirect to login                                  | Redirected to login page                   | PASS   |

---

## Business Rule Verification (Lab 4)

| Rule  | Test                                                  | Result   |
| ----- | ----------------------------------------------------- | -------- |
| BR-01 | Save equipment with empty name                        | Blocked by validation | PASS |
| BR-02 | Save equipment with duplicate asset code              | Blocked (UNIQUE + UI) | PASS |
| BR-03 | Borrow equipment that is not available                | Blocked by `record_borrow()` | PASS |
| BR-04 | Borrower name empty on request                        | Blocked by UI validation | PASS |
| BR-05 | Set due date before borrowing date                    | Blocked by validation + DB | PASS |
| BR-06 | New request receives Pending status                   | Verified — starts as Pending | PASS |
| BR-07 | Only Approved requests can be claimed                 | Blocked by `claim_equipment()` | PASS |
| BR-08 | Returned equipment becomes Available                  | Verified after TC-B4-06 | PASS |
| BR-09 | Overdue detection                                     | Overdue badge shown for past-due | PASS |
| BR-10 | Deletion requires confirmation                        | `confirm()` dialog shown | PASS |
| BR-11 | Role-based permissions enforced                       | Admin, Officer, Borrower access restrictions verified | PASS |
| BR-12 | All actions logged to audit_logs                      | Verified: SUBMIT, APPROVE, REJECT, CANCEL, STATUS_CHANGE, COMPLETE | PASS |

---

## Role-Based Access Verification

| Action                      | Administrator | Officer | Borrower |
| --------------------------- | ------------- | ------- | -------- |
| View Equipment              | ✅ PASS       | ✅ PASS | ✅ PASS  |
| Add/Edit/Delete Equipment   | ✅ PASS       | ✅ PASS | ❌ Hidden |
| Submit Borrow Request       | ✅ PASS       | ✅ PASS | ✅ PASS  |
| Cancel Own Pending Request  | ✅ PASS       | ✅ PASS | ✅ PASS  |
| Approve / Reject Requests   | ✅ PASS       | ✅ PASS | ❌ Hidden |
| Claim Equipment             | ✅ PASS       | ✅ PASS | ❌ Hidden |
| Return Equipment            | ✅ PASS       | ✅ PASS | ❌ Hidden |
| View Audit Logs             | ✅ PASS       | ❌ No nav link | ❌ No nav link |