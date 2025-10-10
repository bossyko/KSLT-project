# 🎾 tennis-kg-api-tests

QA API & UI testing project for [tennis.kg](https://tennis.kg).  
Combines **manual** and **automated** testing using **Postman**, **Cypress**, and **Mocha/Supertest**.

---

## 📂 Project Structure

---

## 🚀 How to Use

### 🔹 Postman API Tests
1. Open Postman and import:
   - `postman/tenniskg-api.postman_collection.json`
   - `postman/tenniskg-api.postman_environment.json`
2. Run manually or via CLI:
   ```bash
   newman run postman/tenniskg-api.postman_collection.json -e postman/tenniskg-api.postman_environment.json
