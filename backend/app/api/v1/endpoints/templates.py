from fastapi import APIRouter, Depends, HTTPException, status, Request, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List, Dict, Any
from app.db.database import get_db
from app.models.template import Template, TemplateItem
from app.models.organization import Organization
from app.models.user import User, UserRole
from app.schemas.template import Template as TemplateSchema, TemplateCreate, TemplateUpdate, TemplateItem as TemplateItemSchema, TemplateItemCreate, TemplateCopy
from app.core.dependencies import get_current_user
from app.core.i18n import get_language, get_template_field

router = APIRouter()

def convert_template_to_dict(template: Template, lang: str = "tr") -> Dict[str, Any]:
    """Convert template to dict with language-specific fields."""
    template_dict = {
        "id": template.id,
        "name": get_template_field(template, "name", lang),
        "description": get_template_field(template, "description", lang),
        "standard": template.standard.value,
        "organization_id": template.organization_id,
        "is_system": template.is_system,
        "created_at": template.created_at,
        "updated_at": template.updated_at,
        "items": []
    }
    
    # Convert items with language-specific fields
    for item in template.items:
        item_dict = {
            "id": item.id,
            "template_id": item.template_id,
            "order_number": item.order_number,
            "control_reference": item.control_reference,
            "default_title": get_template_field(item, "default_title", lang),
            "default_description": get_template_field(item, "default_description", lang),
            "default_severity": item.default_severity.value,
            "default_status": item.default_status.value,
            "default_recommendation": get_template_field(item, "default_recommendation", lang),
            "created_at": item.created_at,
            "updated_at": item.updated_at
        }
        template_dict["items"].append(item_dict)
    
    return template_dict

def check_template_access(user: User, template_id: int, db: Session):
    template = db.query(Template).filter(Template.id == template_id).first()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    # System templates are accessible by everyone (but cannot be modified)
    if template.is_system:
        return template
    
    if user.role == UserRole.PLATFORM_ADMIN:
        return template
    elif user.role == UserRole.ORG_ADMIN:
        if template.organization_id != user.organization_id:
            raise HTTPException(status_code=403, detail="Not enough permissions")
        return template
    else:
        # Auditors can access templates from their organization
        if template.organization_id and template.organization_id == user.organization_id:
            return template
        else:
            raise HTTPException(status_code=403, detail="Not enough permissions")

@router.post("/", response_model=TemplateSchema, status_code=status.HTTP_201_CREATED)
def create_template(
    template: TemplateCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Determine organization ID
    # User-created templates cannot be system templates
    if current_user.role == UserRole.PLATFORM_ADMIN:
        org_id = template.organization_id
        if not org_id:
            raise HTTPException(status_code=400, detail="organization_id is required")
    elif current_user.role == UserRole.ORG_ADMIN:
        org_id = current_user.organization_id
        if template.organization_id and template.organization_id != org_id:
            raise HTTPException(status_code=403, detail="Cannot create template for different organization")
    else:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    # Verify organization exists
    org = db.query(Organization).filter(Organization.id == org_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    
    db_template = Template(
        name=template.name,
        name_en=template.name_en,
        description=template.description,
        description_en=template.description_en,
        standard=template.standard,
        organization_id=org_id,
        is_system=False  # User-created templates are never system templates
    )
    db.add(db_template)
    db.flush()
    
    # Add template items
    if template.items:
        for item_data in template.items:
            item = TemplateItem(
                template_id=db_template.id,
                order_number=item_data.order_number,
                control_reference=item_data.control_reference,
                default_title=item_data.default_title,
                default_title_en=item_data.default_title_en,
                default_description=item_data.default_description,
                default_description_en=item_data.default_description_en,
                default_severity=item_data.default_severity,
                default_status=item_data.default_status,
                default_recommendation=item_data.default_recommendation,
                default_recommendation_en=item_data.default_recommendation_en
            )
            db.add(item)
    
    db.commit()
    db.refresh(db_template)
    return db_template

@router.get("/", response_model=List[Dict[str, Any]])
def read_templates(
    skip: int = 0,
    limit: int = 100,
    organization_id: int = None,
    lang: str = Query(None, description="Language code (tr/en)"),
    request: Request = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Get language
    language = get_language(request, lang)
    
    query = db.query(Template)
    
    if current_user.role == UserRole.PLATFORM_ADMIN:
        if organization_id:
            # Show system templates + templates from specified organization
            query = query.filter(
                or_(
                    Template.is_system == True,
                    Template.organization_id == organization_id
                )
            )
    elif current_user.role == UserRole.ORG_ADMIN:
        # Show system templates + templates from their organization
        query = query.filter(
            or_(
                Template.is_system == True,
                Template.organization_id == current_user.organization_id
            )
        )
    else:
        # Auditors can see system templates + templates from their organization
        if current_user.organization_id:
            query = query.filter(
                or_(
                    Template.is_system == True,
                    Template.organization_id == current_user.organization_id
                )
            )
        else:
            # If no organization, only show system templates
            query = query.filter(Template.is_system == True)
    
    templates = query.offset(skip).limit(limit).all()
    return [convert_template_to_dict(t, language) for t in templates]

@router.get("/{template_id}", response_model=Dict[str, Any])
def read_template(
    template_id: int,
    lang: str = Query(None, description="Language code (tr/en)"),
    request: Request = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Get language
    language = get_language(request, lang)
    
    template = check_template_access(current_user, template_id, db)
    return convert_template_to_dict(template, language)

@router.put("/{template_id}", response_model=TemplateSchema)
def update_template(
    template_id: int,
    template: TemplateUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_template = check_template_access(current_user, template_id, db)
    
    # Prevent modification of system templates
    if db_template.is_system:
        raise HTTPException(
            status_code=403,
            detail="Sistem şablonu düzenlenemez. Bu şablon varsayılan kontrol listesi olduğu için korunmaktadır."
        )
    
    # Prevent modification of is_system flag (even if sent in request)
    update_data = template.dict(exclude_unset=True)
    
    # Remove is_system from update_data if present (it cannot be modified)
    if "is_system" in update_data:
        del update_data["is_system"]
    
    for field, value in update_data.items():
        setattr(db_template, field, value)
    db.commit()
    db.refresh(db_template)
    return db_template

@router.delete("/{template_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_template(
    template_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_template = check_template_access(current_user, template_id, db)
    
    # Prevent deletion of system templates
    if db_template.is_system:
        raise HTTPException(
            status_code=403, 
            detail="Sistem şablonu silinemez. Bu şablon varsayılan kontrol listesi olduğu için korunmaktadır."
        )
    
    db.delete(db_template)
    db.commit()
    return None

@router.post("/{template_id}/copy", response_model=TemplateSchema, status_code=status.HTTP_201_CREATED)
def copy_template(
    template_id: int,
    copy_data: TemplateCopy,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Copy a template. System templates can be copied to create editable versions."""
    source_template = db.query(Template).filter(Template.id == template_id).first()
    if not source_template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    # Check access - allow copying system templates
    if current_user.role == UserRole.PLATFORM_ADMIN:
        # Platform admin can copy to any organization
        if source_template.is_system:
            # System templates have no organization, use provided org_id or source template's org (if any)
            org_id = copy_data.organization_id if copy_data.organization_id else source_template.organization_id
            if not org_id:
                raise HTTPException(status_code=400, detail="organization_id is required when copying system templates")
        else:
            # Use provided org_id or source template's org
            org_id = copy_data.organization_id if copy_data.organization_id else source_template.organization_id
    elif current_user.role == UserRole.ORG_ADMIN:
        # Org admins can copy system templates or templates from their organization
        if source_template.is_system:
            org_id = current_user.organization_id
        elif source_template.organization_id != current_user.organization_id:
            raise HTTPException(status_code=403, detail="Not enough permissions")
        else:
            org_id = current_user.organization_id
    else:
        # Auditors can copy templates from their organization or system templates
        if source_template.is_system:
            org_id = current_user.organization_id
        elif source_template.organization_id != current_user.organization_id:
            raise HTTPException(status_code=403, detail="Not enough permissions")
        else:
            org_id = current_user.organization_id
    
    # Verify organization exists (only if org_id is set)
    if org_id:
        org = db.query(Organization).filter(Organization.id == org_id).first()
        if not org:
            raise HTTPException(status_code=404, detail="Organization not found")
    
    # Generate new name if not provided
    new_name = copy_data.new_name if copy_data.new_name else f"{source_template.name} (Copy)"
    
    # Create new template (not a system template)
    new_template = Template(
        name=new_name,
        name_en=source_template.name_en,
        description=source_template.description,
        description_en=source_template.description_en,
        standard=source_template.standard,
        organization_id=org_id,
        is_system=False  # Copied templates are not system templates
    )
    db.add(new_template)
    db.flush()
    
    # Copy all template items
    for source_item in source_template.items:
        new_item = TemplateItem(
            template_id=new_template.id,
            order_number=source_item.order_number,
            control_reference=source_item.control_reference,
            default_title=source_item.default_title,
            default_title_en=source_item.default_title_en,
            default_description=source_item.default_description,
            default_description_en=source_item.default_description_en,
            default_severity=source_item.default_severity,
            default_status=source_item.default_status,
            default_recommendation=source_item.default_recommendation,
            default_recommendation_en=source_item.default_recommendation_en
        )
        db.add(new_item)
    
    db.commit()
    db.refresh(new_template)
    return new_template

@router.post("/{template_id}/items", response_model=TemplateItemSchema, status_code=status.HTTP_201_CREATED)
def create_template_item(
    template_id: int,
    item: TemplateItemCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    template = check_template_access(current_user, template_id, db)
    
    # Prevent adding items to system templates
    if template.is_system:
        raise HTTPException(
            status_code=403,
            detail="Sistem şablonuna öğe eklenemez. Bu şablon varsayılan kontrol listesi olduğu için korunmaktadır."
        )
    
    db_item = TemplateItem(
        template_id=template_id,
        **item.dict()
    )
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

@router.put("/items/{item_id}", response_model=TemplateItemSchema)
def update_template_item(
    item_id: int,
    item: TemplateItemCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_item = db.query(TemplateItem).filter(TemplateItem.id == item_id).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="Template item not found")
    
    template = check_template_access(current_user, db_item.template_id, db)
    
    # Prevent modification of system template items
    if template.is_system:
        raise HTTPException(
            status_code=403,
            detail="Sistem şablonunun öğeleri düzenlenemez. Bu şablon varsayılan kontrol listesi olduğu için korunmaktadır."
        )
    
    update_data = item.dict()
    for field, value in update_data.items():
        setattr(db_item, field, value)
    db.commit()
    db.refresh(db_item)
    return db_item

@router.delete("/items/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_template_item(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_item = db.query(TemplateItem).filter(TemplateItem.id == item_id).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="Template item not found")
    
    template = check_template_access(current_user, db_item.template_id, db)
    
    # Prevent deletion of system template items
    if template.is_system:
        raise HTTPException(
            status_code=403,
            detail="Sistem şablonunun öğeleri silinemez. Bu şablon varsayılan kontrol listesi olduğu için korunmaktadır."
        )
    
    db.delete(db_item)
    db.commit()
    return None

