import { useTranslation } from 'react-i18next';

export default function LanguageSelector() {
  const { i18n } = useTranslation();

  function onClickLanguage(language: string) {
    i18n.changeLanguage(language);
  }

  return (
    <div>
      <button type="button" onClick={() => onClickLanguage('en')}>
        <img
          className="h-5 w-9"
          title="English"
          alt="US Flag"
          src="https://raw.githubusercontent.com/HeriYantodotDev/image-repos/main/us.png"
        />
      </button>
      <button type="button" onClick={() => onClickLanguage('id')}>
        <img
          className="h-5 w-9"
          title="Indonesian"
          alt="Indonesian Flag"
          src="https://raw.githubusercontent.com/HeriYantodotDev/image-repos/main/id.png"
        />
      </button>
    </div>
  );
}
