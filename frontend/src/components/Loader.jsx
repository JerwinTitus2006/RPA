function Loader({ text = "Processing..." }) {
  return (
    <div className="loader-wrap" role="status" aria-live="polite">
      <span className="loader" />
      <p>{text}</p>
    </div>
  );
}

export default Loader;
