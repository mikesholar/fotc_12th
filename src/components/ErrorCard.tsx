export const ErrorCard = ({ errors }: { readonly errors: readonly string[] }) => (
  <section className="section">
    <div className="errorcard" role="alert">
      <p className="eyebrow eyebrow--coral">Schedule could not be shown</p>
      <h2>Check schedule.json</h2>
      <p className="errorcard__lede">
        The data file has {errors.length} {errors.length === 1 ? "problem" : "problems"}.
        Fix {errors.length === 1 ? "it" : "them"} in <code>public/data/schedule.json</code> and
        reload.
      </p>
      <ul>
        {errors.map((error) => (
          <li key={error}>{error}</li>
        ))}
      </ul>
    </div>
  </section>
);
