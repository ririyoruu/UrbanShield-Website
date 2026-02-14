# is_verified Field Logic

## How is_verified should work with verification_status:

### Status Values and is_verified Mapping:

1. **`verification_status: 'pending'`**
   - `is_verified: NULL` (new user, not yet processed)

2. **`verification_status: 'verified'`**
   - `is_verified: true` (admin approved the user)

3. **`verification_status: 'rejected'`**
   - `is_verified: false` (admin rejected the user)

4. **`verification_status: 'suspended'`**
   - `is_verified: false` (user is suspended)

5. **`verification_status: NULL`**
   - `is_verified: NULL` (new user, not yet processed)

## Current Implementation:

### Approve User:
```javascript
is_verified: true,
verification_status: 'verified'
```

### Reject User:
```javascript
is_verified: false,
verification_status: 'rejected'
```

### Suspend User:
```javascript
is_verified: false,
verification_status: 'suspended'
```

### New User (default):
```javascript
is_verified: NULL,
verification_status: NULL
```

## Database Constraint:
The `is_verified` field is BOOLEAN, so it accepts:
- `true`
- `false` 
- `NULL`

No additional constraint needed for BOOLEAN fields.
