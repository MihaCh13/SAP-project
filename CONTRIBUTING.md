# 🤝 Contribution Guidelines

## 📌 Core Rules

* ❌ DO NOT work directly in the `main` branch
* ✅ All changes must go through a Pull Request (PR)
* ✅ Every PR requires at least 1 approval

---

## 🌿 Branching Strategy

Every developer must create their own branch:

Examples:

* `feature/login`
* `feature/database`
* `bugfix/navbar`

Creating a branch:

```
git checkout -b feature/your-feature-name
```

---

## 🔄 Workflow

1. Get the latest version:

```
git pull origin main
```

2. Create a branch:

```
git checkout -b feature/your-task
```

3. Make changes and commit:

```
git add .
git commit -m "Describe your change"
```

4. Push to GitHub:

```
git push origin feature/your-task
```

5. Create a Pull Request in GitHub

---

## 👀 Code Review

* Every Pull Request must be approved by at least 1 person
* If there are comments → they must be resolved before merging
* If new commits are added → the approval is reset

---

## 🚫 Prohibited Actions

* ❌ Direct push to `main`
* ❌ Force push to `main`
* ❌ Deleting the `main` branch

---

## 💡 Best Practices

* Write clear commit messages
* Work on small tasks (small PRs)
* Communicate with the team when making changes

---

## 🧠 Goal

To maintain stable, readable, and safe code for everyone 🚀
