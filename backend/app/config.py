from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    OPENAI_API_KEY: str = ""
    DATABASE_URL: str = "sqlite:///./yuanfen.db"
    TWILIO_ACCOUNT_SID: str = ""
    TWILIO_AUTH_TOKEN: str = ""
    TWILIO_PHONE_NUMBER: str = ""
    ADMIN_TOKEN: str = "yftest123"

    # --- LoopMessage (iMessage) ---
    LOOP_AUTH_KEY: str = "yftest123"
    LOOP_SECRET_KEY: str = "2LBMdZGOA8J7f9YT-_ApFRDVRGMignlYqDS_NOaWxw4bppK2SuSvrwp4rq8MNb4G"
    LOOP_SENDER_NAME: str = "mei"
    LOOP_WEBHOOK_SECRET: str = "<any random string you also paste in their dashboard>"
    MESSAGING_PROVIDER: str = "loop"  # "loop" or "twilio"


settings = Settings()
