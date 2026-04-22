# SAP-project
Document Version Control System (DVCS) designed for collaborative document management. Features include role-based access (Author, Reviewer, Reader, Admin), version history tracking, approval workflows, and client-server architecture. Developed as part of a SAP course project.

## 📝 Project Description
 
In many organizations, documents undergo frequent changes by multiple users. The lack of control leads to information loss and confusion regarding which is the latest up-to-date version.

This project is a software solution for document version control that ensures traceability, security, and a proper workflow through roles and approvals.

---

## 🏗️ Architecture and Technical Requirements

- **Architecture:** Client-Server, supporting simultaneous work by multiple users  
- **Development Language:** Java  
- **Data Format:** SQL database / JSON / XML  
- **Interface:** Console mode (planned GUI as a bonus)  
- **Stability:** Full exception handling and notifications for invalid actions or insufficient permissions  

---

## 👥 User Roles

| Role       | Rights and Capabilities |
|------------|-------------------|
| **Author** | Creates new documents and versions, edits drafts, and views history |
| **Reviewer** | Approves or rejects versions, adds comments to documents |
| **Reader** | Read-only access to active and already approved versions |
| **Admin** | Manages user profiles, their roles, and system configuration |

---

## 🔥 Core Features

1. **Linear Versioning:** Each document contains metadata and a sequence of versions  
2. **Immutability:** Once created, a version cannot be altered (Immutable)  
3. **Approval Workflow:** A new version becomes "Active" only after an `APPROVED` status. Rejected versions remain in the history  
4. **Comparison:** Functionality to compare the differences between two versions of the same document  
5. **Security:** Validation of permissions before every operation  

---

## 🌟 Bonus Features (Roadmap)

- [ ] Visualization of differences (diff) between versions  
- [ ] Audit log for tracking actions within the system  
- [ ] Export of the active version in PDF or TXT formats  

---

## 📂 Solution Components

The project is considered complete upon the presence of:

- [x] **Business Model:** Lean Canvas of the idea  
- [x] **Diagrams:** Architecture diagram and database diagram  
- [x] **Code:** Full source code of the application  
- [x] **Testing:** Automated or manual tests  
- [x] **Documentation:** Technical description of the modules  

---

## 🚀 Running the Application
