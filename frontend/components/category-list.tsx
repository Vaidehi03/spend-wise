"use client"

import { useState } from "react"
import { Edit, Trash } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

// Sample data - would be replaced with real data from API
const categories = [
  "Food & Dining",
  "Transportation",
  "Entertainment",
  "Utilities",
  "Shopping",
  "Housing",
  "Healthcare",
  "Personal Care",
  "Education",
  "Travel",
  "Other",
]

export function CategoryList() {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [categoryToDelete, setCategoryToDelete] = useState("")
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [categoryToEdit, setCategoryToEdit] = useState("")
  const [newCategoryName, setNewCategoryName] = useState("")

  const handleEditClick = (category: string) => {
    setCategoryToEdit(category)
    setNewCategoryName(category)
    setIsEditDialogOpen(true)
  }

  const handleDeleteClick = (category: string) => {
    setCategoryToDelete(category)
    setIsDeleteDialogOpen(true)
  }

  return (
    <div className="space-y-2">
      {categories.map((category) => (
        <Card key={category}>
          <CardContent className="p-3 flex items-center justify-between">
            <Badge variant="outline" className="font-normal text-sm">
              {category}
            </Badge>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={() => handleEditClick(category)}>
                <Edit className="h-4 w-4" />
                <span className="sr-only">Edit</span>
              </Button>
              <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(category)}>
                <Trash className="h-4 w-4" />
                <span className="sr-only">Delete</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <Input
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="Category name"
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => setIsEditDialogOpen(false)}>Save Changes</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete the category "{categoryToDelete}" and cannot be undone. Expenses with this category will
              be moved to "Other".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

