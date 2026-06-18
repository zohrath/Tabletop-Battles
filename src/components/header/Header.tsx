type HeaderProps = {
  subtitle: string;
  title: string;
  titleId: string;
};

export function Header({ subtitle, title, titleId }: HeaderProps) {
  return (
    <div>
      <h2 id={titleId}>{title}</h2>
      <p>{subtitle}</p>
    </div>
  );
}
