# Requirements Traceability Matrix

| Requirement ID | Functional Requirement | Implemented Feature        | Test Case | Test Result |
| -------------- | ---------------------- | -------------------------- | --------- | ----------- |
| FR-01          | User Login             | Login / Sign-up page       | TC-01     | PASS        |
| FR-02          | Add Equipment          | Equipment form + insert    | TC-02     | PASS        |
| FR-03          | Edit Equipment         | Edit equipment modal       | TC-03     | PASS        |
| FR-04          | Delete Equipment       | Delete with confirmation   | TC-04     | PASS        |
| FR-05          | Record Borrowing       | New borrowing transaction  | TC-05     | PASS        |
| FR-06          | Return Equipment       | Return button + function   | TC-06     | PASS        |
| FR-07          | Detect Overdue         | Overdue status (BR-09)      | TC-07     | PASS        |
| FR-08          | Search Records         | Search bar (name/code/borrower) | TC-08 | PASS        |
| FR-09          | Filter Records         | Status / availability filters | TC-09   | PASS        |
| FR-10          | Dashboard Summary      | Dashboard statistics       | TC-10     | PASS        |

## Functional Test Results

| Test ID | Test Scenario                | Expected Result                                     | Actual Result | Status |
| ------- | ---------------------------- | --------------------------------------------------- | ------------- | ------ |
| TC-01   | Login with valid account     | Dashboard displayed                                 | Dashboard displayed | PASS |
| TC-02   | Add equipment                | Record successfully saved                           | Record saved and shown in table | PASS |
| TC-03   | Edit equipment               | Changes displayed                                   | Edited values displayed | PASS |
| TC-04   | Delete equipment             | Confirmation shown before deletion                  | Confirm dialog shown; deleted on confirm | PASS |
| TC-05   | Borrow available equipment   | Transaction saved and equipment becomes Borrowed    | Transaction saved; equipment shows Borrowed | PASS |
| TC-06   | Return equipment             | Transaction becomes Returned and equipment becomes Available | Status Returned; equipment Available | PASS |
| TC-07   | View late borrowing          | Record displayed as Overdue                         | Overdue badge shown (BR-09) | PASS |
| TC-08   | Search borrower              | Matching transactions displayed                     | Matching records displayed | PASS |
| TC-09   | Filter Borrowed status       | Only Borrowed transactions displayed                | Only Borrowed rows shown | PASS |
| TC-10   | Open deployment URL          | System accessible online                            | System loads via GitHub Pages | PASS |

## Business Rule Verification

| Rule | Test                                          | Result |
| ---- | --------------------------------------------- | ------ |
| BR-01 | Save equipment with empty name               | Blocked by validation | PASS |
| BR-02 | Save equipment with duplicate asset code     | Blocked (UNIQUE + UI) | PASS |
| BR-03 | Borrow equipment that is not available       | Blocked by `record_borrow()` | PASS |
| BR-05 | Set due date before borrowing date           | Blocked by validation + DB | PASS |
| BR-08 | Returned equipment becomes Available         | Verified after TC-06 | PASS |
| BR-09 | Overdue detection                            | Verified in TC-07 | PASS |
| BR-10 | Deletion confirmation                        | Verified in TC-04 | PASS |
| BR-11 | Unauthenticated user access                  | Redirected to login (RLS) | PASS |
| BR-12 | Return a transaction twice                   | Blocked by `return_equipment()` | PASS |