from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_create_and_update_weekly_report() -> None:
    login = client.post(
        "/auth/login",
        json={"email": "pm@projectcontrol.local", "password": "password123"},
    )
    assert login.status_code == 200
    token = login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    create = client.post(
        "/projects/1/weekly-reports",
        json={
            "reporting_date": "2026-09-22",
            "executive_summary": "Итоги по инфраструктуре.",
            "key_achievements": "Завершена подготовка.",
            "next_week_activities": "Запуск тестовых проверок.",
            "management_comments": "Без критичных замечаний.",
        },
        headers=headers,
    )
    assert create.status_code == 200, create.text
    report = create.json()
    assert report["status"] == "draft"
    assert report["executive_summary"] == "Итоги по инфраструктуре."

    update = client.patch(
        f"/projects/1/weekly-reports/{report['id']}",
        json={
            "status": "published",
            "executive_summary": "Скорректированные итоги.",
        },
        headers=headers,
    )
    assert update.status_code == 200, update.text
    payload = update.json()
    assert payload["status"] == "published"
    assert payload["executive_summary"] == "Скорректированные итоги."
