export function PageIntro({ title, children, aside }) {
  return <header className="page-intro frame"><div><h1 className="page-title">{title}</h1>{children && <div className="page-lead">{children}</div>}</div>{aside && <div className="page-intro-aside">{aside}</div>}</header>
}
