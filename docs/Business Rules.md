# Business Rules

| ID | Business Rule | Enforcement Mechanism |
|----|---------------|-----------------------|
| BR-01 | Equipment name cannot be empty | UI validation |
| BR-02 | Asset code must be unique | Database `UNIQUE` constraint |
| BR-03 | Only available equipment may be borrowed | Database `record_borrow()` & `claim_equipment()` functions |
| BR-04 | Borrower name must be provided | UI validation |
| BR-05 | Due date cannot be earlier than borrowing date | Database `CHECK` constraint |
| BR-06 | New requests receive Pending status | Database `record_borrow()` function |
| BR-07 | Approved requests allow claiming equipment availability | Database `claim_equipment()` function |
| BR-08 | Returned equipment becomes available again | Database `return_equipment()` function |
| BR-09 | Equipment past due date identified as Overdue | UI `computedStatus()` JavaScript function |
| BR-10 | Deletion requires confirmation | UI `confirm()` dialog |
| BR-11 | Role-based permissions (Admin, Officer, Borrower) | Supabase Auth + RLS |
| BR-12 | Audit logs capture all system actions | Database `log_audit()` + Triggers/Functions |
