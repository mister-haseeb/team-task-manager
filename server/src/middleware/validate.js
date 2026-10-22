// Validates req.body / req.query / req.params against a Joi schema.
// The cleaned value is stored on req.validated[source]; unknown keys are dropped.
module.exports = function validate(schema, source = 'body') {
  return (req, res, next) => {
    const { value, error } = schema.validate(req[source] || {}, {
      abortEarly: false,
      stripUnknown: true,
      errors: { wrap: { label: false } },
    });

    if (error) {
      return res.status(400).json({ error: error.details.map((d) => d.message).join('. ') });
    }

    req.validated = { ...req.validated, [source]: value };
    return next();
  };
};
