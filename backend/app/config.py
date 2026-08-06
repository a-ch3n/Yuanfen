from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    OPENAI_API_KEY: str = ""
    DATABASE_URL: str = "sqlite:///./yuanfen.db"
    TWILIO_ACCOUNT_SID: str = ""
    TWILIO_AUTH_TOKEN: str = ""
    TWILIO_PHONE_NUMBER: str = ""
    ADMIN_TOKEN: str = "change-me-please"

    # --- LoopMessage (iMessage) ---
    LOOP_AUTH_KEY: str = ""
    LOOP_SECRET_KEY: str = ""
    LOOP_SENDER_NAME: str = ""
    LOOP_WEBHOOK_SECRET: str = ""
    MESSAGING_PROVIDER: str = "loop"  # "loop" or "twilio"


settings = Settings()
