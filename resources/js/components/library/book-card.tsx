import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import type { Book } from '@/types/library';
import { Calendar, Edit3, Tag, Trash2, User } from 'lucide-react';

interface BookCardProps {
    book: Book;
    onEdit: (book: Book) => void;
    onDelete: (book: Book) => void;
}

export function BookCard({ book, onEdit, onDelete }: BookCardProps) {
    return (
        <Card className="h-full transition hover:shadow-md">
            <article className="flex h-full flex-col justify-between">
                <CardContent className="p-5">
                    <div className="mb-3 flex items-center justify-between gap-2">
                        <Badge variant="secondary" className="gap-1">
                            <Tag className="h-3 w-3" aria-hidden />
                            {book.category?.name ?? `Categoría #${book.category_id}`}
                        </Badge>
                        <span className="text-muted-foreground inline-flex items-center gap-1 text-xs font-medium tabular-nums">
                            <Calendar className="h-3.5 w-3.5" aria-hidden />
                            {book.published_year}
                        </span>
                    </div>

                    <h2 className="text-lg font-bold">{book.title}</h2>

                    <p className="text-muted-foreground mt-1 flex items-center gap-1.5 text-sm font-medium">
                        <User className="h-3.5 w-3.5" aria-hidden />
                        {book.author}
                    </p>

                    {book.description ? (
                        <p className="text-muted-foreground mt-3 line-clamp-3 text-sm leading-relaxed">{book.description}</p>
                    ) : (
                        <p className="text-muted-foreground mt-3 text-xs italic">Sin descripción registrada.</p>
                    )}
                </CardContent>

                <CardFooter className="justify-between gap-2 border-t px-5 py-3">
                    <Button variant="outline" size="sm" onClick={() => onEdit(book)} aria-label={`Editar ${book.title}`}>
                        <Edit3 aria-hidden />
                        Editar
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => onDelete(book)}
                        aria-label={`Eliminar ${book.title}`}
                    >
                        <Trash2 aria-hidden />
                        Eliminar
                    </Button>
                </CardFooter>
            </article>
        </Card>
    );
}
