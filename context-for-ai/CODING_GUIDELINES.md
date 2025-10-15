# Coding Guidelines & Standards
## Claims Management System (CMS)

**Document Owner:** rdevarakond88  
**Last Updated:** October 2025  
**Purpose:** Provide standards for AI-assisted code generation and human developers

---

## 🎯 Core Principles

1. **Clarity over cleverness** — Code should be easy to understand, even for non-developers
2. **Consistency** — Follow established patterns throughout the codebase
3. **Simplicity** — Use the most straightforward solution that works
4. **Documentation** — Comment the "why," not the "what"
5. **Security-first** — Never compromise on basic security practices

---

## 🛠️ Tech Stack

### Backend
- **Runtime:** Node.js (v18+)
- **Framework:** Express.js (v4)
- **Database:** PostgreSQL (v14+)
- **ORM:** Prisma (v5)
- **Authentication:** express-session + connect-pg-simple
- **Password Hashing:** bcrypt
- **Validation:** Joi or express-validator
- **Environment Variables:** dotenv

### Frontend
- **Framework:** React (v18) with TypeScript
- **Build Tool:** Vite
- **Styling:** Tailwind CSS (v3)
- **Routing:** React Router (v6)
- **HTTP Client:** Axios
- **State Management:** React Context API (no Redux for MVP)
- **Forms:** React Hook Form
- **Date Handling:** date-fns

### DevOps (Phase 3)
- **Containerization:** Docker
- **Orchestration:** Docker Compose (MVP), Kubernetes (future)
- **CI/CD:** GitHub Actions
- **Monitoring:** Prometheus + Grafana (future)

---

## 📁 Project Structure

### Backend Structure
```
/backend
├── /src
│   ├── /config
│   │   └── database.js          # Database connection config
│   ├── /middleware
│   │   ├── auth.js              # Authentication middleware
│   │   ├── errorHandler.js      # Global error handler
│   │   └── validateRequest.js   # Request validation
│   ├── /routes
│   │   ├── auth.routes.js       # Auth endpoints
│   │   ├── claims.routes.js     # Claims endpoints
│   │   ├── users.routes.js      # User endpoints
│   │   └── index.js             # Route aggregator
│   ├── /controllers
│   │   ├── auth.controller.js   # Auth business logic
│   │   ├── claims.controller.js # Claims business logic
│   │   └── users.controller.js  # User business logic
│   ├── /services
│   │   ├── claim.service.js     # Claim data operations
│   │   ├── user.service.js      # User data operations
│   │   └── audit.service.js     # Audit logging
│   ├── /models
│   │   └── (Prisma handles this via schema.prisma)
│   ├── /utils
│   │   ├── validators.js        # Custom validation functions
│   │   ├── errorCodes.js        # Error code constants
│   │   └── claimNumberGenerator.js  # Claim ID generator
│   ├── app.js                   # Express app setup
│   └── server.js                # Server entry point
├── /prisma
│   ├── schema.prisma            # Database schema
│   └── /migrations              # Database migrations
├── /tests
│   ├── /unit                    # Unit tests
│   └── /integration             # Integration tests
├── .env.example                 # Environment variables template
├── .gitignore
├── package.json
└── README.md
```

### Frontend Structure
```
/frontend
├── /src
│   ├── /api
│   │   ├── client.js            # Axios instance with defaults
│   │   ├── auth.api.js          # Auth API calls
│   │   ├── claims.api.js        # Claims API calls
│   │   └── users.api.js         # Users API calls
│   ├── /components
│   │   ├── /common
│   │   │   ├── Button.jsx       # Reusable button component
│   │   │   ├── Input.jsx        # Reusable input component
│   │   │   ├── Modal.jsx        # Reusable modal component
│   │   │   └── StatusBadge.jsx  # Claim status badge
│   │   ├── /claims
│   │   │   ├── ClaimForm.jsx    # Claim submission form
│   │   │   ├── ClaimList.jsx    # Claims table
│   │   │   └── ClaimDetail.jsx  # Claim detail view
│   │   └── /layout
│   │       ├── Header.jsx       # Top navigation
│   │       ├── Sidebar.jsx      # Side navigation
│   │       └── Layout.jsx       # Main layout wrapper
│   ├── /pages
│   │   ├── LoginPage.jsx        # Login screen
│   │   ├── DashboardPage.jsx    # Dashboard (provider or payer)
│   │   ├── ClaimSubmitPage.jsx  # Claim submission page
│   │   ├── ClaimDetailPage.jsx  # Claim detail page
│   │   └── NotFoundPage.jsx     # 404 page
│   ├── /context
│   │   └── AuthContext.jsx      # Authentication state
│   ├── /hooks
│   │   ├── useAuth.js           # Auth hook
│   │   └── useClaims.js         # Claims data hook
│   ├── /utils
│   │   ├── formatters.js        # Date/currency formatters
│   │   └── validators.js        # Form validators
│   ├── App.jsx                  # Root component
│   ├── main.jsx                 # Entry point
│   └── index.css                # Global styles + Tailwind
├── /public
│   └── favicon.ico
├── .env.example
├── .gitignore
├── package.json
├── tailwind.config.js
├── vite.config.js
└── README.md
```

---

## 🔤 Naming Conventions

### Files
- **Components:** PascalCase — `ClaimForm.jsx`, `StatusBadge.jsx`
- **Utilities:** camelCase — `validators.js`, `formatters.js`
- **Routes/Controllers:** kebab-case — `auth.routes.js`, `claims.controller.js`

### Variables & Functions
- **Variables:** camelCase — `claimNumber`, `approvedAmount`
- **Constants:** UPPER_SNAKE_CASE — `MAX_CLAIM_AMOUNT`, `SESSION_TIMEOUT`
- **Functions:** camelCase, verb-first — `submitClaim()`, `validatePatientInfo()`
- **React Components:** PascalCase — `ClaimForm`, `StatusBadge`

### Database
- **Tables:** snake_case, plural — `claims`, `audit_log`, `users`
- **Columns:** snake_case — `claim_number`, `submitted_at`, `approved_amount`
- **Foreign Keys:** `<table>_id` — `provider_id`, `user_id`

### API Endpoints
- **Resources:** plural, lowercase — `/api/v1/claims`, `/api/v1/users`
- **Actions:** verb after ID — `/api/v1/claims/:id/adjudicate`

---

## 📝 Code Style

### JavaScript/TypeScript

**Use modern ES6+ syntax:**
```javascript
// ✅ Good
const submitClaim = async (claimData) => {
  const { patient, service } = claimData;
  // ...
};

// ❌ Avoid
function submitClaim(claimData) {
  var patient = claimData.patient;
  // ...
}
```

**Use async/await over promises:**
```javascript
// ✅ Good
const claim = await claimService.create(data);

// ❌ Avoid
claimService.create(data).then(claim => { ... });
```

**Destructure objects for clarity:**
```javascript
// ✅ Good
const { firstName, lastName, dateOfBirth } = patient;

// ❌ Avoid
const firstName = patient.firstName;
const lastName = patient.lastName;
```

**Use template literals:**
```javascript
// ✅ Good
const message = `Claim ${claimNumber} submitted successfully`;

// ❌ Avoid
const message = 'Claim ' + claimNumber + ' submitted successfully';
```

### React Components

**Functional components with hooks:**
```jsx
// ✅ Good
const ClaimForm = ({ onSubmit }) => {
  const [formData, setFormData] = useState(initialState);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    await onSubmit(formData);
  };
  
  return (
    <form onSubmit={handleSubmit}>
      {/* ... */}
    </form>
  );
};

// ❌ Avoid class components
class ClaimForm extends React.Component { ... }
```

**PropTypes or TypeScript for props:**
```jsx
// With TypeScript
interface ClaimFormProps {
  onSubmit: (data: ClaimData) => Promise<void>;
  initialValues?: ClaimData;
}

const ClaimForm: React.FC<ClaimFormProps> = ({ onSubmit, initialValues }) => {
  // ...
};
```

---

## 🔒 Security Guidelines

### CRITICAL: Never Do These

**❌ NEVER store passwords in plain text**
```javascript
// ❌ WRONG
user.password = password;

// ✅ CORRECT
user.passwordHash = await bcrypt.hash(password, 10);
```

**❌ NEVER expose sensitive data in API responses**
```javascript
// ❌ WRONG
return res.json({ user }); // includes password_hash

// ✅ CORRECT
const { password_hash, ...safeUser } = user;
return res.json({ user: safeUser });
```

**❌ NEVER trust user input without validation**
```javascript
// ❌ WRONG
const claim = await db.claims.create(req.body);

// ✅ CORRECT
const validated = validateClaimData(req.body);
const claim = await db.claims.create(validated);
```

**❌ NEVER use string concatenation for SQL (use ORM)**
```javascript
// ❌ WRONG (SQL injection risk)
const query = `SELECT * FROM users WHERE email = '${email}'`;

// ✅ CORRECT (Prisma handles this)
const user = await prisma.user.findUnique({ where: { email } });
```

### Security Best Practices

**1. Input Validation**
- Validate all inputs on backend (never trust frontend validation alone)
- Use validation libraries (Joi, express-validator)
- Sanitize inputs to prevent XSS

**2. Authentication**
- Use bcrypt with salt rounds >= 10
- Implement session expiration (30 minutes)
- Use HttpOnly, Secure, SameSite cookies

**3. Authorization**
- Check user role on every protected endpoint
- Verify resource ownership (providers can only see their claims)
- Return 403 Forbidden (not 404) for unauthorized access

**4. Error Handling**
- Never expose stack traces in production
- Log errors securely (don't log sensitive data)
- Use generic error messages for clients

---

## 📊 Database Guidelines

### Using Prisma ORM

**Schema Definition (schema.prisma):**
```prisma
model Claim {
  id              String   @id @default(uuid())
  claimNumber     String   @unique @map("claim_number")
  status          String   @default("submitted")
  billedAmount    Decimal  @map("billed_amount") @db.Decimal(10, 2)
  
  provider        Provider @relation(fields: [providerId], references: [id])
  providerId      String   @map("provider_id")
  
  createdAt       DateTime @default(now()) @map("created_at")
  updatedAt       DateTime @updatedAt @map("updated_at")
  
  @@map("claims")
}
```

**Queries:**
```javascript
// ✅ Good - Include related data
const claim = await prisma.claim.findUnique({
  where: { id: claimId },
  include: {
    provider: true,
    submittedBy: true,
    adjudicatedBy: true
  }
});

// ✅ Good - Filter with type safety
const claims = await prisma.claim.findMany({
  where: {
    status: 'submitted',
    providerId: user.providerId
  },
  orderBy: { submittedAt: 'desc' }
});
```

**Transactions:**
```javascript
// ✅ Use transactions for multi-step operations
const result = await prisma.$transaction(async (tx) => {
  // Update claim
  const claim = await tx.claim.update({
    where: { id: claimId },
    data: { status: 'approved', approvedAmount }
  });
  
  // Log audit trail
  await tx.auditLog.create({
    data: {
      claimId,
      userId: adjudicatorId,
      action: 'approved'
    }
  });
  
  return claim;
});
```

---

## 🧪 Testing Guidelines

### Unit Tests
```javascript
// Test individual functions
describe('claimNumberGenerator', () => {
  it('should generate claim number in correct format', () => {
    const claimNumber = generateClaimNumber();
    expect(claimNumber).toMatch(/^CLM-\d{8}-\d{4}$/);
  });
});
```

### Integration Tests
```javascript
// Test API endpoints
describe('POST /api/v1/claims', () => {
  it('should create claim with valid data', async () => {
    const response = await request(app)
      .post('/api/v1/claims')
      .set('Cookie', sessionCookie)
      .send(validClaimData)
      .expect(201);
      
    expect(response.body.claim).toHaveProperty('claim_number');
    expect(response.body.claim.status).toBe('submitted');
  });
});
```

---

## 💬 Comments & Documentation

### When to Comment

**✅ Comment these:**
- Complex business logic
- Non-obvious algorithms
- Workarounds for bugs/limitations
- Security-sensitive code
- Public API functions

**❌ Don't comment these:**
- Obvious code (e.g., `// increment i` for `i++`)
- What the code does (code should be self-documenting)

### Comment Style

```javascript
/**
 * Generates a unique claim number in format CLM-YYYYMMDD-####
 * 
 * @returns {string} Claim number (e.g., "CLM-20251015-0001")
 * 
 * Note: Uses current date in Eastern timezone to ensure consistent
 * daily sequence numbers across distributed systems.
 */
const generateClaimNumber = () => {
  // Implementation details...
};
```

---

## 🚫 Anti-Patterns to Avoid

### Backend

**❌ Fat controllers**
```javascript
// ❌ WRONG - business logic in controller
router.post('/claims', async (req, res) => {
  const claim = await db.claims.create(req.body);
  await db.auditLog.create({ claimId: claim.id });
  await sendEmail(claim);
  // ... 50 more lines
});

// ✅ CORRECT - delegate to service layer
router.post('/claims', claimsController.create);
// Controller calls claimService.create() which handles all logic
```

**❌ Callback hell**
```javascript
// ❌ WRONG
getClaim(id, (err, claim) => {
  getProvider(claim.providerId, (err, provider) => {
    getUser(claim.userId, (err, user) => {
      // ...
    });
  });
});

// ✅ CORRECT
const claim = await getClaim(id);
const provider = await getProvider(claim.providerId);
const user = await getUser(claim.userId);
```

### Frontend

**❌ Prop drilling**
```jsx
// ❌ WRONG - passing props through many levels
<App userData={user}>
  <Dashboard userData={user}>
    <ClaimsList userData={user}>
      <ClaimItem userData={user} />
    </ClaimsList>
  </Dashboard>
</App>

// ✅ CORRECT - use Context
const AuthContext = createContext();
// ClaimItem accesses user via useContext(AuthContext)
```

**❌ Inline styles**
```jsx
// ❌ WRONG
<button style={{ backgroundColor: 'blue', padding: '10px' }}>Submit</button>

// ✅ CORRECT - use Tailwind classes
<button className="bg-blue-500 px-4 py-2">Submit</button>
```

---

## 🌐 API Development Guidelines

### Request Validation
```javascript
// ✅ Validate at route level
router.post('/claims', validateClaimRequest, claimsController.create);

// Validation middleware
const validateClaimRequest = (req, res, next) => {
  const schema = Joi.object({
    patient: Joi.object({
      firstName: Joi.string().required().max(100),
      // ...
    }),
    service: Joi.object({
      cptCode: Joi.string().pattern(/^\d{5}$/).required(),
      // ...
    })
  });
  
  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: error.details[0].message
      }
    });
  }
  next();
};
```

### Error Handling
```javascript
// ✅ Use centralized error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  
  // Don't expose internal errors in production
  const statusCode = err.statusCode || 500;
  const message = process.env.NODE_ENV === 'production' 
    ? 'Internal server error'
    : err.message;
  
  res.status(statusCode).json({
    error: {
      code: err.code || 'INTERNAL_ERROR',
      message
    }
  });
});
```

---

## 📦 Environment Variables

### Required Variables

**Backend (.env):**
```
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://user:password@localhost:5432/cms_db
SESSION_SECRET=your-super-secret-key-change-this
BCRYPT_ROUNDS=10
```

**Frontend (.env):**
```
VITE_API_BASE_URL=http://localhost:3000/api/v1
```

### Best Practices
- Never commit `.env` files (use `.env.example` as template)
- Use strong, randomly generated secrets in production
- Access via `process.env.VARIABLE_NAME`
- Validate required variables on startup

---

## 🎨 UI/UX Guidelines

### Tailwind CSS Conventions

**Use utility classes consistently:**
```jsx
// ✅ Good
<button className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded">
  Submit Claim
</button>

// ❌ Avoid custom CSS unless absolutely necessary
```

**Color Scheme:**
- Primary: Blue (`blue-500`, `blue-600`)
- Success/Approved: Green (`green-500`)
- Error/Denied: Red (`red-500`)
- Warning: Yellow (`yellow-500`)
- Neutral: Gray (`gray-100` to `gray-900`)

**Status Badge Colors:**
- Submitted: `bg-blue-100 text-blue-800`
- Under Review: `bg-yellow-100 text-yellow-800`
- Approved: `bg-green-100 text-green-800`
- Denied: `bg-red-100 text-red-800`

---

## 🔄 Git Workflow

### Commit Messages
```
feat: Add claim submission form with validation
fix: Correct approved amount validation logic
docs: Update API contracts with new endpoint
refactor: Extract claim validation to separate service
test: Add unit tests for claim number generator
```

**Format:** `<type>: <description>`

**Types:**
- `feat` — New feature
- `fix` — Bug fix
- `docs` — Documentation only
- `refactor` — Code restructuring (no behavior change)
- `test` — Adding/updating tests
- `chore` — Maintenance (dependencies, config)

### Branch Strategy (Future)
- `main` — Production-ready code
- `develop` — Integration branch
- `feature/claim-submission` — Feature branches
- `fix/validation-bug` — Bug fix branches

---

## 🚀 Performance Guidelines

### Database
- Use indexes on frequently queried fields
- Avoid N+1 queries (use `include` in Prisma)
- Limit result sets (pagination)

### Frontend
- Lazy load components with `React.lazy()`
- Debounce search inputs (300ms)
- Cache API responses where appropriate
- Optimize images (use WebP format)

---

## 📚 Learning Resources

If Claude Code generates something you don't understand, refer to:
- **Express.js:** https://expressjs.com/
- **Prisma:** https://www.prisma.io/docs
- **React:** https://react.dev/
- **Tailwind CSS:** https://tailwindcss.com/docs

---

**End of Coding Guidelines**

*These guidelines ensure consistency, maintainability, and security throughout the codebase. All code—whether written by humans or AI—should follow these standards.*
