# 🤝 Contribution Guidelines

## 📌 Основни правила

* ❌ НЕ се работи директно в `main` branch
* ✅ Всички промени минават през Pull Request (PR)
* ✅ Всеки PR трябва да има поне 1 одобрение

---

## 🌿 Работа с branch-ове

Всеки разработчик създава собствен branch:

Примери:

* `feature/login`
* `feature/database`
* `bugfix/navbar`

Създаване на branch:

```
git checkout -b feature/your-feature-name
```

---

## 🔄 Workflow

1. Вземи последната версия:

```
git pull origin main
```

2. Създай branch:

```
git checkout -b feature/your-task
```

3. Направи промени и commit:

```
git add .
git commit -m "Describe your change"
```

4. Push към GitHub:

```
git push origin feature/your-task
```

5. Създай Pull Request в GitHub

---

## 👀 Code Review

* Всеки Pull Request трябва да бъде одобрен от поне 1 човек
* Ако има коментари → трябва да бъдат разрешени преди merge
* Ако се добавят нови commit-и → одобрението се нулира

---

## 🚫 Забранени действия

* ❌ Direct push към `main`
* ❌ Force push към `main`
* ❌ Изтриване на `main` branch

---

## 💡 Добри практики

* Пиши ясни commit съобщения
* Работи по малки задачи (малки PR-и)
* Комуникирай с екипа при промени

---

## 🧠 Цел

Да поддържаме стабилен, четим и безопасен код за всички 🚀
