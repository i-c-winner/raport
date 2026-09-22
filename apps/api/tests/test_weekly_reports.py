import zipfile
from pathlib import Path

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


def test_generate_weekly_report_document(monkeypatch, tmp_path: Path) -> None:
    import app.api.routes.weekly_reports as weekly_reports_module

    monkeypatch.setattr(weekly_reports_module, "REPORTS_DIR", tmp_path)

    login = client.post(
        "/auth/login",
        json={"email": "pm@projectcontrol.local", "password": "password123"},
    )
    assert login.status_code == 200
    token = login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    response = client.post(
        "/projects/1/weekly-reports/generate",
        headers=headers,
    )
    assert response.status_code == 200, response.text

    created = response.json()
    assert created["project_id"] == 1
    assert created["reporting_date"]

    doc_path = tmp_path / f"project_1_{created['reporting_date']}.pptx"
    assert doc_path.exists(), doc_path

    with zipfile.ZipFile(doc_path) as archive:
        slide_text = "\n".join(
            archive.read(f"ppt/slides/slide{index}.xml").decode("utf-8") for index in range(1, 7)
        )
        assert "Белоусов Д.А" in slide_text
        assert "Риски" in slide_text
        assert "Проблемы" in slide_text
        assert "Решения" in slide_text
        assert "Изменения" in slide_text
