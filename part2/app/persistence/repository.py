#!/usr/bin/python3
"""Define repository interfaces and in-memory storage."""

from abc import ABC, abstractmethod


class Repository(ABC):
    """Define the required methods for repository classes."""

    @abstractmethod
    def add(self, obj):
        """Add an object to the repository."""
        pass

    @abstractmethod
    def get(self, obj_id):
        """Retrieve an object by its ID."""
        pass

    @abstractmethod
    def get_all(self):
        """Retrieve all stored objects."""
        pass

    @abstractmethod
    def update(self, obj_id, data):
        """Update an object using the provided data."""
        pass

    @abstractmethod
    def delete(self, obj_id):
        """Delete an object by its ID."""
        pass

    @abstractmethod
    def get_by_attribute(self, attr_name, attr_value):
        """Retrieve an object by one of its attributes."""
        pass


class InMemoryRepository(Repository):
    """Store and manage objects in memory."""

    def __init__(self):
        """Initialize an empty in-memory storage dictionary."""
        self._storage = {}

    def add(self, obj):
        """Add an object using its ID as the dictionary key."""
        self._storage[obj.id] = obj

    def get(self, obj_id):
        """Retrieve an object by its ID."""
        return self._storage.get(obj_id)

    def get_all(self):
        """Return all stored objects as a list."""
        return list(self._storage.values())

    def update(self, obj_id, data):
        """Update an existing object."""
        obj = self.get(obj_id)

        if obj is not None:
            obj.update(data)

    def delete(self, obj_id):
        """Delete an object if it exists."""
        if obj_id in self._storage:
            del self._storage[obj_id]

    def get_by_attribute(self, attr_name, attr_value):
        """Retrieve the first object matching an attribute value."""
        return next(
            (
                obj
                for obj in self._storage.values()
                if getattr(obj, attr_name, None) == attr_value
            ),
            None
        )
