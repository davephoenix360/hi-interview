from sqlalchemy import func, select
from sqlalchemy.orm import Session

from server.business.client.schema import PClient, PClientListItem
from server.data.models.client import Client
from server.data.models.client_advisor import ClientAdvisor


def list_clients(session: Session, user_id: str) -> list[PClientListItem]:
    advisor_count_subquery = (
        select(func.count(ClientAdvisor.user_id))
        .where(ClientAdvisor.client_id == Client.id)
        .scalar_subquery()
    )
    is_my_client_subquery = (
        select(ClientAdvisor.user_id)
        .where(
            ClientAdvisor.client_id == Client.id,
            ClientAdvisor.user_id == user_id,
        )
        .exists()
    )

    rows = session.execute(
        select(
            Client,
            advisor_count_subquery.label("advisor_count"),
            is_my_client_subquery.label("is_my_client"),
        )
    ).all()

    clients: list[PClientListItem] = []
    for client, advisor_count, is_my_client in rows:
        base_client = PClient.model_validate(client).model_dump()
        clients.append(
            PClientListItem.model_validate(
                {
                    **base_client,
                    "advisor_count": advisor_count,
                    "is_my_client": is_my_client,
                }
            )
        )

    return clients
