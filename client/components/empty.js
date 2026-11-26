import Link from 'next/link';

/**
 * @param {{ title: string, body?: string, href?: string, action?: string }} props
 */
export default function Empty({ title, body, href, action }) {
  return (
    <section className="empty">
      <h2>{title}</h2>
      {body ? <p>{body}</p> : null}
      {href && action ? (
        <Link className="button" href={href}>
          {action}
        </Link>
      ) : null}
    </section>
  );
}
