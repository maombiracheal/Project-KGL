// Validate procurement creation payload.
const validateProcurement = (req, res, next) => {
  // Read procurement fields from request body.
  const { produce, tonnageKg, costUGX, dealerName, dealerContact, branch, sellingPricePerKg } =
    req.body;

  // Collect all validation messages before responding.
  const errors = [];

  if (!produce || produce.trim().length < 2) {
    errors.push('Produce name is required (min 2 characters)');
  }

  if (!tonnageKg || tonnageKg < 100) {
    errors.push('Tonnage must be at least 100 kg');
  }

  if (!costUGX || costUGX < 10000) {
    errors.push('Cost must be at least 10,000 UGX');
  }

  if (!dealerName || dealerName.trim().length < 2) {
    errors.push('Dealer name is required (min 2 characters)');
  }

  if (!dealerContact || !isValidUgandanPhone(dealerContact)) {
    errors.push('Valid Ugandan phone number required');
  }

  if (!branch) {
    errors.push('Branch is required');
  }

  if (!sellingPricePerKg || sellingPricePerKg <= 0) {
    errors.push('Selling price per kg is required');
  }

  // Return all validation errors at once if any exist.
  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }

  // Continue to next middleware when validation passes.
  next();
};
// Validate cash sale payload.
const validateSale = (req, res, next) => {
  // Read sale fields from request body.
  const { produce, tonnageKg, amountPaidUGX, buyerName } = req.body;

  // Collect all validation messages.
  const errors = [];

  if (!produce) {
    errors.push('Produce is required');
  }

  if (!tonnageKg || tonnageKg < 1) {
    errors.push('Tonnage must be at least 1 kg');
  }

  if (!amountPaidUGX || amountPaidUGX < 10000) {
    errors.push('Amount paid must be at least 10,000 UGX');
  }

  if (!buyerName || buyerName.trim().length < 2) {
    errors.push('Buyer name is required (min 2 characters)');
  }

  // Return error list if validation failed.
  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }

  // Continue when input is valid.
  next();
};
// Validate credit sale payload.
const validateCreditSale = (req, res, next) => {
  // Read credit sale fields from request body.
  const {
    produce,
    buyerName,
    nationalId,
    location,
    contact,
    tonnageKg,
    amountDueUGX,
    dueDate,
  } = req.body;

  // Collect validation errors.
  const errors = [];

  if (!produce) {
    errors.push('Produce is required');
  }

  if (!buyerName || buyerName.trim().length < 2) {
    errors.push('Buyer name is required (min 2 characters)');
  }

  if (!nationalId || !isValidUgandanNIN(nationalId)) {
    errors.push('Valid Ugandan National ID required');
  }

  if (!location || location.trim().length < 2) {
    errors.push('Location is required (min 2 characters)');
  }

  if (!contact || !isValidUgandanPhone(contact)) {
    errors.push('Valid Ugandan phone number required');
  }

  if (!tonnageKg || tonnageKg < 1) {
    errors.push('Tonnage must be at least 1 kg');
  }

  if (!amountDueUGX || amountDueUGX < 10000) {
    errors.push('Amount due must be at least 10,000 UGX');
  }

  if (!dueDate) {
    errors.push('Due date is required');
  }

  // Return error list if validation failed.
  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }

  // Continue when input is valid.
  next();
};

// Validate Ugandan phone formats like +2567XXXXXXXX or 07XXXXXXXX.
function isValidUgandanPhone(phone) {
  const phoneRegex = /^(\+256|0)(7[0-9]{8}|3[0-9]{8})$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
}

// Validate Ugandan NIN format.
function isValidUgandanNIN(nin) {
  const ninRegex = /^[A-Z]{2}[A-Z0-9]{13}$/i;
  return ninRegex.test(nin.replace(/\s/g, ''));
}

// Export request validators for routes.
module.exports = { validateProcurement, validateSale, validateCreditSale };

